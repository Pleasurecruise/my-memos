import { ai } from "void/ai";
import { z } from "zod";
import type { TagDefinition } from "./definitions";

const MAX_TOPICS = 2;

const replySchema = z.object({
  result: z.object({
    answers: z.record(
      z.string(),
      z.discriminatedUnion("type", [
        z.object({ type: z.literal("choice"), choice: z.string() }),
        z.object({ type: z.literal("noul"), noul: z.number() }),
      ]),
    ),
  }),
});

export async function classifyMemo(
  content: string,
  definitions: TagDefinition[],
): Promise<string[]> {
  const types = definitions.filter(({ kind }) => kind === "type");
  const topics = definitions.filter(({ kind }) => kind === "topic");
  const questions = Object.fromEntries([
    [
      "type",
      {
        type: "choice",
        instructions: "Which kind of note is `memo`?",
        criteria: Object.fromEntries(types.map(({ name, description }) => [name, description])),
      },
    ],
    ...topics.map(({ description }, index) => [
      `t${index}`,
      { type: "noul", instructions: `Is \`memo\` about ${description}?` },
    ]),
  ]);

  const reply = replySchema.parse(
    await ai.run(
      "typesafe/jev",
      { state: { memo: content }, questions },
      { gateway: { id: "default" } },
    ),
  );
  const { answers } = reply.result;

  const type = answers.type;
  if (type === undefined || type.type !== "choice") {
    throw new Error("Jev left the memo type unanswered.");
  }
  const scored = topics.map(({ name }, index) => {
    const answer = answers[`t${index}`];
    if (answer === undefined || answer.type !== "noul") {
      throw new Error(`Jev left topic "${name}" unanswered.`);
    }
    return { name, noul: answer.noul };
  });
  return [
    type.choice,
    ...scored
      .filter(({ noul }) => noul >= 0.5)
      .sort((a, b) => b.noul - a.noul)
      .slice(0, MAX_TOPICS)
      .map(({ name }) => name),
  ];
}
