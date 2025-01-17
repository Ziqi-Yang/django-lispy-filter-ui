// types.ts
export type Operator = 'and' | 'or' | 'not';
export type ComparisonOperator = 'equals' | 'contains'; // add more as needed

export interface Condition {
  field: string;
  operator: ComparisonOperator;
  value: string;
  not?: boolean;
}

export interface Group {
  operator: Operator;
  not?: boolean;
  children: (Condition | Group)[];
}

export interface FilterEditorOptions {
  container: HTMLElement | string;
  onChange?: (filter: Group) => void;
  initialValue?: Group;
  fields?: Array<{
    name: string;
    label: string;
    operators: ComparisonOperator[];
  }>;
}
