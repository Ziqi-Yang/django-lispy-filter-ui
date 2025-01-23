import './main.css';

import type {
  FilterEditorOptions,
  LispyExpression,
  LispyConditionExpr,
  LispyOperator,
  Schema,
  SchemaField
} from './types';

import type {
  CascaderOptionsData
} from 'cascaderjs';

import Cascader from 'cascaderjs';

import { isLispyConditionExpr, isLispyExpression, isLispyOperator } from './types';

import { trans } from './trans';

import { OperatorSelect } from './components/operator-selector';
import { html2node } from './utils';
import { genFieldsListFromSchema, getField } from './schema.ts';

const NON_INITIALIZED_FIELD_SELECTER_QUERY =
      '.dlf-field-selector:not(:has(> .cascader-container))';

export class FilterEditor {
  private container: HTMLElement;
  private expression: LispyExpression;
  private schema: Schema;
  private mainModel: string;
  private fieldsList: CascaderOptionsData[];

  constructor(options: FilterEditorOptions) {
    const container = typeof options.container === 'string' 
      ? document.querySelector(options.container)! 
      : options.container;
    
    if (!container)
      throw Error(`Cannot find element ${options.container}`)
    this.container = container as HTMLElement;
        
    this.expression = options.initialExpression || ['and'];
    this.schema = options.schema;
    this.mainModel = options.mainModel;
    this.fieldsList = genFieldsListFromSchema(this.mainModel, this.schema.models);
    this.init();
  }

  private init() {
    this.render();
    this.attachEventListeners();

    while (!this.setupNewCascaderSelect()) {}
  }

  
  /**
   * setup a new CascaderSelect
   */
  private setupNewCascaderSelect(): Cascader | null {
    const conditionInputContainerElem =
          document.querySelector(NON_INITIALIZED_FIELD_SELECTER_QUERY);
    
    if (!conditionInputContainerElem) return null;

    let prevCascaderValue: string[] | undefined;
    
    const cascader = new Cascader(NON_INITIALIZED_FIELD_SELECTER_QUERY,
      {
        mode: "single",
        // don't set placeholder, see issue https://github.com/phaoer/Cascader/issues/7
        // placeholder: trans(["fieldSelector", "placeholder"]),
        data: this.fieldsList,
        showClear: false,
        onChange: (value, _labelValue, _indexValue) => {
          // NOTE this function is called every time user clicks
          if (value.length && prevCascaderValue != value) {
            const field = getField(value, this.mainModel, this.schema.models);
            this.setupClassSelector(conditionInputContainerElem.parentElement as HTMLElement, field);
          }
          prevCascaderValue = value;
        },
        displayRender(value) {
          return value.join(" > ");
        },
      }
    );
    cascader.init();
    
    return cascader;
  }

  private setupClassSelector(
    conditionInputContainerElem: HTMLElement,
    field: SchemaField,
  ) {
    const lookups = this.schema.lookups[field.class];
    
    const classSelectorDivEelm =
          conditionInputContainerElem.querySelector(".dlf-class-selector")!;
    const valueInputDivElem = conditionInputContainerElem.querySelector(".dlf-value-input")!;

    const newClassSelectorElem: HTMLSelectElement = document.createElement("select");
    newClassSelectorElem.className = 'dlf-select';
    lookups.forEach(lookup => {
      const optionElem = document.createElement("option");
      optionElem.value = lookup;
      optionElem.label = trans(["lookup", lookup])
      newClassSelectorElem.append(optionElem)
    });
    
    classSelectorDivEelm.replaceChildren(newClassSelectorElem);
    
    // TODO put new element
    valueInputDivElem.replaceChildren();
    this.setupValueInput(conditionInputContainerElem, field, newClassSelectorElem.value);
    
    newClassSelectorElem.addEventListener("change", () => {
     this.setupValueInput(conditionInputContainerElem, field, newClassSelectorElem.value);
    })
  }

  private setupValueInput(
    conditionInputContainerElem: HTMLElement,
    field: SchemaField,
    lookup: string,
  ) {
    const valueInputDivElem = conditionInputContainerElem.querySelector(".dlf-value-input")!;
    if (field.choices) {
      const selectElem = document.createElement("select");
      selectElem.className = 'dlf-select';
      for (const [key, value] of Object.entries(field.choices)) {
        const optionElem = document.createElement("option");
        optionElem.value = key;
        optionElem.label = value;
        selectElem.append(optionElem);
        return;
      }
    }
    
    const valueInputElem = document.createElement("input");
    valueInputElem.className = 'dlf-input';
    const field_class = field.class;
    
    let input_type = "";
    switch (field_class) {
      case "AutoField":
      case "BigAutoField":
      case "BigIntegerField":
      case "SmallAutoField":
      case "SmallIntegerField":
      case "DecimalField":
      case "DurationField":
      case "FloatField":
      case "IntegerField":
      case "PositiveBigIntegerField":
      case "PositiveIntegerField":
      case "PositiveSmallIntegerField":
      case "URLField":
      case "UUIDField":
        input_type = "number";
        break;
      case "BooleanField":
        input_type = "checkbox";
        break;
      case "CharField":
      case "EmailField":
      case "EmailField":
      case "FileField":
      case "FilePathField":
      case "GenericIPAddressField":
      case "ImageField":
      case "SlugField":
      case "TextField":
        input_type = "text";
        break;
      case "DateField":
      case "DateTimeField":
      case "TimeField":
        input_type = "datetime-local";
        break;
    }

    if (lookup == "isnull") {
      input_type = "checkbox";
    }
    
    valueInputElem.type = input_type;
    valueInputDivElem.replaceChildren(valueInputElem);
  }

  private render() {
    this.container.innerHTML = `
    <div class="dlf-root-container">
      ${this.renderExpression(this.expression)}
    </div>
    `;
  }

  private renderExpression(expr: LispyExpression): string {
    let isNegated = false;
    let [operator, ...subExpressions] = expr;

    // Handle negation
    if (operator === 'not') {
      if (subExpressions.length !== 1) {
        throw new Error('NOT expression must have exactly one subexpression');
      }
        
      isNegated = true;
      const nestedExpr = subExpressions[0];
      [operator, ...subExpressions] = nestedExpr;
    }

    if (operator == "=") {
      const conditionExpr = [operator, ...subExpressions];
      if (!isLispyConditionExpr(conditionExpr)) {
        throw Error(`${conditionExpr} is a valid LispyConditionExpr!`);
      }
      
      return this.renderCondition(conditionExpr, true);
    }

    const children = subExpressions.map(expr => {
      if (!isLispyExpression(expr)) {
        throw new Error(`${expr} is not a valid LispyExpression`);
      }
      
      return expr[0] == "="
        ? this.renderCondition(expr as LispyConditionExpr)
        : this.renderExpression(expr as LispyExpression)
    }).join('');
    
    return `
    <div class="dlf-group dlf-expanded">
      <div class="dlf-group-prefix">
        ${isNegated ? this.renderOperator('not') : ""}
        ${this.renderOperator(operator)}
        <div class="dlf-group-collapse">
          <span class="dlf-parenthesis">(</span>
          <span class="dlf-ellipsis">...</span>
          <span class="dlf-parenthesis">)</span>
        </div>          
        <div>
          <div class="dlf:tooltip" data-tip="${trans('toggle-not')}" >
            <button class="dlf-icon-button" data-action="toggle-not">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  stroke-width="1.5" stroke="currentColor" class="dlf:size-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
            </button>
          </div>
        </div>
      </div>
        
      <div class="dlf-indent">
        ${children}
        <div>
          <div class="dlf:tooltip" data-tip="${trans('add-new-condition')}" >
            <button class="dlf-icon-button" data-action="add-condition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
                class="dlf:size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="dlf-parenthesis">)</div>
    </div>
    `;
  }

  private renderOperator(operator: LispyOperator) {
    let tip = trans(["operator-tip", operator]);
    return `
    <span class="dlf-operator dlf-${operator}-operator dlf:tooltip" data-tip="${tip}"
      data-value="${operator}">
      ${trans(["operator", operator])}
    </span>
    `;
  }

  private renderCondition(
    condition: LispyConditionExpr,
    isNegated: boolean = false
  ): string {
    return `
    <div class="dlf-condition dlf:group">
      ${isNegated ? this.renderOperator('not') : ""}
      <div class="dlf-condition-input-container dlf:flex dlf:gap-2 dlf:items-center" >
        <div class="dlf-field-selector"></div>
        <div class="dlf-class-selector"></div>
        <div class="dlf-value-input"></div>
      </div>
      
      <div class="dlf:invisible dlf:group-hover:visible gap-2">

        <div class="dlf:tooltip" data-tip="${trans('delete-condition')}">
          <button class="dlf-icon-button" data-action="delete-condition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              stroke-width="2.5" stroke="currentColor"
              class="dlf:size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="dlf:tooltip" data-tip="${trans('toggle-not')}" >
          <button class="dlf-icon-button" data-action="toggle-not">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                stroke-width="1.5" stroke="currentColor" class="dlf:size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
          </button>
        </div>
      </div>
    </div>
    `;
  }

  private attachEventListeners() {
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.closest('.dlf-group-collapse')) {
        const group = target.closest('.dlf-group');
        if (group) {
          group.classList.toggle('dlf-expanded');
        }
        return;
      }

      const btnElem = target.closest('button');
      if (btnElem) {
        const action = btnElem.dataset.action;

        switch (action) {
          case 'add-condition':
            console.log('add');
            break;
          case 'delete-condition':
            console.log('delete');
            break;
          case 'toggle-not':
            this.toggleNot(btnElem);
            break;
        }
        return;
      }

      const operatorElem = target.closest('.dlf-operator');
      if (operatorElem && !operatorElem.classList.contains("dlf-not-operator")) {
        new OperatorSelect(operatorElem as HTMLElement);
      }
    });
  }

  private toggleNot(btnElem: HTMLElement) {
    const closestConditionElem = btnElem.closest(".dlf-condition");
    let parentElem = null;
    if (closestConditionElem) {
      parentElem = closestConditionElem;
    } else {
      parentElem = btnElem.closest(".dlf-group-prefix");
    }
    if (!parentElem) {
      throw new Error("While executing 'toggle-not' action, parent element canot be found!")
    }

    const notOpElem = parentElem.querySelector(".dlf-not-operator");
    if (notOpElem) {
      notOpElem.remove();
    } else {
      parentElem.insertBefore(html2node(this.renderOperator("not")), parentElem.firstChild);
    }
  }

  public toJson(): LispyExpression {
    const rootGroup = this.container.querySelector('.dlf-group');
    if (!rootGroup) {
      return ['and']; // Default empty expression
    }
    return this.parseGroup(rootGroup);
  }

  private parseGroup(groupElement: Element): LispyExpression {
    const operators = Array.from(
      groupElement.querySelectorAll('.dlf-group-prefix .dlf-operator')
    ).map(op => op.classList.toString());

    // Check if this group is negated
    const isNegated = operators.some(cls => cls.includes('dlf-not-operator'));
    
    // Get the main operator (and/or/xor)
    const mainOperator = operators.find(cls => 
      ['dlf-and-operator', 'dlf-or-operator', 'dlf-xor-operator'].some(op => cls.includes(op))
    );
    
    const operator = mainOperator
      ?.match(/dlf-(and|or|xor)-operator/)?.[1] || 'and';

    // Parse all conditions and nested groups
    const indent = groupElement.querySelector('.dlf-indent');
    if (!indent) {
      // @ts-ignore
      return [operator]; 
    }

    const children = Array.from(indent.children)
      .filter(child => 
        child.classList.contains('dlf-condition') || 
        child.classList.contains('dlf-group')
      )
      .map(child => {
        if (child.classList.contains('dlf-condition')) {
          return this.parseCondition(child);
        } else {
          return this.parseGroup(child);
        }
      });

    // @ts-ignore
    const expression: LispyExpression = [operator, ...children];
    
    // Wrap in NOT if negated
    return isNegated ? ['not', expression] : expression;
  }

  private parseCondition(conditionElement: Element): LispyExpression {
    const isNegated = conditionElement



    // For demo, just extract the text content
    // In real implementation, you'll want to parse the actual field and value
    const text = conditionElement.textContent?.trim() || '';
    const parts = text.split(' ').filter(Boolean);
    
    // Create a basic condition expression
    // This is a simplified version - you'll need to adjust based on your actual condition format
    const condition: LispyConditionExpr = ['=', parts[0], parts[parts.length - 1]];
    
    return isNegated ? ['not', condition] : condition;
  }
}


