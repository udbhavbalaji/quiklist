import { Command } from "commander";

export const initAppCommand = new Command("init").description(
  "Initialize quiklist.",
);

export const createListCommand = new Command("create")
  .description("Create a new quiklist in the current directory.")
  .option("-y", "Create the list with the default options.", false);
export const addCommand = new Command("add");
export const showCommand = new Command("show")
  .description("Show the items in this checklist.")
  .option(
    "-u [unchecked]",
    "Only show the unchecked items in the list.",
    false,
  );
export const markCommand = new Command("mark").description(
  "Mark/Unmark item(s).",
);
export const deleteCommand = new Command("delete");
export const editCommand = new Command("edit").description(
  "Edit details of an item.",
);
