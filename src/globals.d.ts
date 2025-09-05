declare module "inquirer-honshin-select" {
  import { Separator } from "@inquirer/core";
  export type Action<ActionValue> = {
    value: ActionValue;
    name: string;
    key: string;
  };
  type Choice<Value> = {
    value: Value;
    name?: string;
    description?: string;
    disabled?: boolean | string;
    type?: never;
  };
  type ActionSelectResult<ActionValue, Value> = {
    action?: ActionValue;
    answer: Value;
  };

  export declare class CancelablePromise<T> extends Promise<T> {
    cancel: () => void;
    static withResolver<T>(): {
      promise: CancelablePromise<T>;
      resolve: (value: T) => void;
      reject: (error: unknown) => void;
    };
  }
  declare const _default: <ActionValue, Value>(
    config: {
      message: string;
      actions: readonly Action<ActionValue>[];
      choices: readonly (Separator | Choice<Value>)[];
      pageSize?: number;
      loop?: boolean;
      default?: unknown;
      theme?: {
        icon?: {
          cursor?: string;
        };
        style?: {
          disabled?: {};
          answer?: {};
          message?: {};
          error?: {};
          defaultAnswer?: {};
          help?: {};
          highlight?: {};
          key?: {};
        };
        prefix?: string;
        spinner?: {
          interval?: number;
          frames?: string[];
        };
      };
    },
    context?: import("@inquirer/type").Context,
  ) => CancelablePromise<ActionSelectResult<ActionValue, Value>>;
  export default _default;
  export { Separator };
}
