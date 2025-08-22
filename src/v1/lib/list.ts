import {
  InternalListOption,
  ListItem,
  Priority,
  SortOrder,
} from "@/types/list";

export const splitListItems = (items: InternalListOption[]) => {
  const checkedItems: InternalListOption[] = [];
  const uncheckedItems: InternalListOption[] = [];

  items.forEach((item) => {
    if (item.done) checkedItems.push(item);
    else uncheckedItems.push(item);
  });

  return { checkedItems, uncheckedItems };
};

export const priorityMapping: Record<Priority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const sortByCreatedDate = (
  listItems: InternalListOption[],
  sortOrder: SortOrder,
) => {
  return sortOrder === "descending"
    ? listItems.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    : listItems.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
};

export const sortByDeadline = (
  listItems: InternalListOption[],
  sortOrder: SortOrder,
) => {
  // return sortOrder === "descending" ? listItems.sort((a,b) => priorityMapping[b.priority] - priorityMapping[a.priority]) : listItems.sort((a,b) => priorityMapping[a.priority] - priorityMapping[b.priority])

  const itemsWithDeadline: InternalListOption[] = [];
  const itemsWithoutDeadline: InternalListOption[] = [];

  listItems.forEach((item) =>
    item.deadline
      ? itemsWithDeadline.push(item)
      : itemsWithoutDeadline.push(item),
  );

  const sortedItems =
    sortOrder === "descending"
      ? itemsWithDeadline.sort(
        (a, b) =>
          new Date(b.deadline!).getTime() - new Date(a.deadline!).getTime(),
      )
      : itemsWithDeadline.sort(
        (a, b) =>
          new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime(),
      );
  return sortedItems.concat(itemsWithoutDeadline);
};

export const sortByPriority = (
  listItems: InternalListOption[],
  sortOrder: SortOrder,
) => {
  // const itemsWithPriority: ListItem[] = [];
  // const itemsWithoutPriority: ListItem[] = [];
  //
  // listItems.forEach((item) => {
  //   if (item.priority) {
  //     itemsWithPriority.push({ ...item, priority: item.priority as Priority });
  //   } else {
  //     itemsWithoutPriority.push({ ...item, priority: undefined });
  //   }
  // });
  //
  // const sortedItems =
  //   sortOrder === "descending"
  //     ? itemsWithPriority.sort(
  //       (a, b) => priorityMapping[b.priority!] - priorityMapping[a.priority!],
  //     )
  //     : itemsWithPriority.sort(
  //       (a, b) => priorityMapping[a.priority!] - priorityMapping[b.priority!],
  //     );
  //
  // return sortedItems.concat(itemsWithoutPriority);

  return sortOrder === "descending"
    ? listItems.sort(
      (a, b) => priorityMapping[b.priority] - priorityMapping[a.priority],
    )
    : listItems.sort(
      (a, b) => priorityMapping[a.priority] - priorityMapping[b.priority],
    );
};
