<script module lang="ts">
  export const title = "Table";
</script>

<script lang="ts">
  import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "../../src";
  import DemoPage from "../DemoPage.svelte";

  const usage = `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@my-memos/ui";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>INV-001</TableCell>
      <TableCell>¥12,400</TableCell>
    </TableRow>
  </TableBody>
</Table>`;

  const rows = [
    { id: "INV-001", status: "Paid", method: "Transfer", amount: "¥12,400" },
    { id: "INV-002", status: "Pending", method: "Card", amount: "¥3,800" },
    { id: "INV-003", status: "Paid", method: "Transfer", amount: "¥7,200" },
    { id: "INV-004", status: "Failed", method: "Card", amount: "¥960" },
  ];
</script>

<DemoPage {usage}>
  <Table>
    <TableCaption>Recent invoices</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead>Invoice</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Method</TableHead>
        <TableHead style="text-align: right;">Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#each rows as row (row.id)}
        <TableRow>
          <TableCell style="font-family: var(--font-mono); font-size: 12px;">
            {row.id}
          </TableCell>
          <TableCell>{row.status}</TableCell>
          <TableCell>{row.method}</TableCell>
          <TableCell style="text-align: right; font-family: var(--font-mono); font-size: 12px;">
            {row.amount}
          </TableCell>
        </TableRow>
      {/each}
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell colSpan={3}>Total</TableCell>
        <TableCell style="text-align: right; font-family: var(--font-mono); font-size: 12px;">
          ¥24,360
        </TableCell>
      </TableRow>
    </TableFooter>
  </Table>
</DemoPage>