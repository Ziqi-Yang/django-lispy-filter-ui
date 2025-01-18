// types.ts
export type LogicalOperator = 'and' | 'or';
export type ComparisonOperator = '=' | '!=' | '>' | '<' | '>=' | '<=';

export type LispyCondition = [ComparisonOperator, string, string | number];
export type LispyExpression = [LogicalOperator, ...(LispyCondition | LispyExpression)[]];

export interface Field {
  name: string;
  label: string;
  type: 'string' | 'number';
}

export interface FilterEditorOptions {
  container: HTMLElement | string;
  onChange?: (filter: LispyExpression) => void;
  onError?: (error: Error) => void;
  fields: Field[];
  initialValue?: LispyExpression;
}
