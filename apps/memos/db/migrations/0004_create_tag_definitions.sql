CREATE TABLE IF NOT EXISTS tag_definitions (
  name TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('type', 'topic', 'channel')),
  description TEXT NOT NULL
);

INSERT OR IGNORE INTO tag_definitions (name, kind, description) VALUES
  ('思考', 'type', 'A reflection, opinion or line of reasoning about life, people or society'),
  ('开发', 'type', 'Software development notes: project ideas, bugs, technical designs'),
  ('日常', 'type', 'A light observation or small moment from everyday life'),
  ('待办', 'type', 'A to-do list, checklist or plan of things to do'),
  ('备忘', 'type', 'Reference material kept for later: facts, commands, links, comparisons'),
  ('提示词', 'type', 'A prompt written for an AI model'),
  ('学业', 'type', 'University study: courses, exams, revision, applications, thesis'),
  ('抱怨', 'type', 'A rant or complaint about something annoying'),
  ('emo', 'type', 'Sadness, loneliness or low mood'),
  ('摘录', 'type', 'A quotation or excerpt written by someone else'),
  ('愿望', 'type', 'A wish list, or something the author wants to have or do'),
  ('ai', 'topic', 'artificial intelligence, AI models, agents or vibe coding'),
  ('社交', 'topic', 'social media, followers, or relationships with other people'),
  ('工作', 'topic', 'jobs, internships, interviews or the workplace'),
  ('英国', 'topic', 'life in the United Kingdom'),
  ('成长', 'topic', 'growing up, childhood, education or personal growth'),
  ('比赛', 'topic', 'hackathons, competitions or demo days'),
  ('绘图', 'topic', 'an image-generation or photo-editing prompt'),
  ('美食', 'topic', 'food, cooking, coffee or restaurants'),
  ('旅行', 'topic', 'travel or trips'),
  ('理财', 'topic', 'money, banking, subscriptions or taxes'),
  ('申研', 'topic', 'applying to graduate school'),
  ('角色', 'topic', 'a role-play persona prompt'),
  ('twitter', 'channel', 'The memo was also posted on Twitter');
