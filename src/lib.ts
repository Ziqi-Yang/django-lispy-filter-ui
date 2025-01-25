import './main.css';

import Sortable from 'sortablejs';

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
import { genFieldsListFromSchema, getField } from './schema.ts';

const NON_INITIALIZED_FIELD_SELECTER_QUERY =
      '.dlf-field-selector:not(:has(> .cascader-container))';
const CASCADER_SPLIT_STR = " > ";

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
    this.render(this.expression);
    this.setupEventListener();

    while (!this.setupNewCascaderSelect()) {}

    this.setupSortableForGroup(this.container.querySelector('.dlf-group-body-conditions')!);
  }

  private setupSortableForGroup(containerElem: HTMLElement) {
    Sortable.create(containerElem, {
      group: "dlf-sortable",  // allow sort for nested elements
      filter: ".dlf-sortable-ignore",
      swapThreshold: 0.65,
      draggable: ".dlf-sortable",
      ghostClass: "dlf-sortable-ghost",
      chosenClass: "",
	    dragClass: "",
    });
  }

  
  /**
   * setup a new CascaderSelect
   */
  private setupNewCascaderSelect(): Cascader | null {
    const fieldSelectorDivElem =
          document.querySelector(NON_INITIALIZED_FIELD_SELECTER_QUERY);
    
    if (!fieldSelectorDivElem) return null;

    const rawInitialValue = fieldSelectorDivElem.getAttribute("data-initial-value");
    let initialValue: string[] | undefined;
    if (rawInitialValue) {
      initialValue = rawInitialValue.split(",");
    }
    let prevCascaderValue: string[] | undefined;
    
    const cascader = new Cascader(NON_INITIALIZED_FIELD_SELECTER_QUERY,
      {
        mode: "single",
        placeholder: trans(["fieldSelector", "placeholder"]),
        data: this.fieldsList,
        showClear: false,
        defaultValue: initialValue,
        onChange: (value, _labelValue, _indexValue) => {
          // NOTE this function is called every time user clicks
          if (value.length && prevCascaderValue != value) {
            const field = getField(value, this.mainModel, this.schema.models);
            this.setupLookupSelector(fieldSelectorDivElem.parentElement as HTMLElement, field);
          }
          prevCascaderValue = value;

          fieldSelectorDivElem.setAttribute("data-value", value.toString());
        },
        displayRender(value) {
          return value.join(CASCADER_SPLIT_STR);
        },
      }
    );
    cascader.init();

    if (initialValue) {
      const field = getField(initialValue, this.mainModel, this.schema.models);
      this.setupLookupSelector(fieldSelectorDivElem.parentElement as HTMLElement, field);
      fieldSelectorDivElem.removeAttribute("data-initial-value");
      
      fieldSelectorDivElem.setAttribute("data-value", initialValue.toString());
    }

    // this.cascaderSelectMap.set(conditionInputContainerElem)
    return cascader;
  }

  private setupLookupSelector(
    conditionInputContainerElem: HTMLElement,
    field: SchemaField,
  ) {
    const lookups = this.schema.lookups[field.class];
    
    const lookupSelectorElem =
          conditionInputContainerElem.querySelector(".dlf-lookup-selector")!;
    const valueInputDivElem = conditionInputContainerElem.querySelector(".dlf-value-input")!;

    const newLookupSelectorElem: HTMLSelectElement = document.createElement("select");
    newLookupSelectorElem.className = 'dlf-select';
    lookups.forEach(lookup => {
      const optionElem = document.createElement("option");
      optionElem.value = lookup;
      optionElem.label = trans(["lookup", lookup])
      newLookupSelectorElem.append(optionElem)
    });
    const initial_value = lookupSelectorElem.getAttribute("data-initial-value");
    if (initial_value) {
      if (lookups.includes(initial_value)) {
        newLookupSelectorElem.value = initial_value;
      } else {
        console.error(`The initial_value ${initial_value} is not in lookups! Element:`, lookupSelectorElem);
      }
      lookupSelectorElem.removeAttribute("data-initial-value");
    }
    
    lookupSelectorElem.replaceChildren(newLookupSelectorElem);
    
    valueInputDivElem.replaceChildren();
    this.setupValueInput(conditionInputContainerElem, field, newLookupSelectorElem.value);
    
    newLookupSelectorElem.addEventListener("change", () => {
      this.setupValueInput(conditionInputContainerElem, field, newLookupSelectorElem.value);
    })
  }

  private setupValueInput(
    conditionInputContainerElem: HTMLElement,
    field: SchemaField,
    lookup: string,
  ) {
    const valueInputDivElem = conditionInputContainerElem.querySelector(".dlf-value-input")!;
    const initialValue = valueInputDivElem.getAttribute("data-initial-value");
    
    if (field.choices) {
      const selectElem = document.createElement("select");
      selectElem.className = 'dlf-select';
      for (const [key, value] of Object.entries(field.choices)) {
        const optionElem = document.createElement("option");
        optionElem.value = key;
        optionElem.label = value;
        selectElem.append(optionElem);

        if (initialValue) {
          if (initialValue in field.choices) {
            selectElem.value = initialValue;
          }
          valueInputDivElem.removeAttribute("data-initial-value");
        }

        return;
      }

      
    }
    
    const valueInputElem = document.createElement("input");
    valueInputElem.className = 'dlf-input';
    if (initialValue) {
      valueInputElem.value = initialValue;
      valueInputDivElem.removeAttribute("data-initial-value");
    }
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
      case "FileField":
      case "FilePathField":
      case "GenericIPAddressField":
      case "ImageField":
      case "SlugField":
      case "TextField":
        input_type = "text";
        break;
      case "DateField":
        input_type = "date";
        break;
      case "DateTimeField":
        input_type = "datetime-local";
        break;
      case "TimeField":
        input_type = "time";
        break;
    }

    if (lookup == "isnull") {
      input_type = "checkbox";
    }
    
    valueInputElem.type = input_type;
    valueInputDivElem.replaceChildren(valueInputElem);
  }

  private render(expression: LispyExpression) {
    this.container.innerHTML = `
    <div class="dlf-root-container">
      ${this.renderExpression(expression)}
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
      
      return this.renderCondition(true, conditionExpr);
    }

    const children = subExpressions.map(expr => {
      if (!isLispyExpression(expr)) {
        throw new Error(`${expr} is not a valid LispyExpression`);
      }
      
      return expr[0] == "="
        ? this.renderCondition(false, expr as LispyConditionExpr)
        : this.renderExpression(expr as LispyExpression)
    }).join('');
    
    return `
    <div class="dlf-group dlf-sortable dlf-expanded dlf:group/group">
      <div class="dlf-group-prefix">
        ${isNegated ? this.renderOperator('not') : ""}
        ${this.renderOperator(operator)}
        <div class="dlf-group-collapse">
          <span class="dlf-parenthesis">(</span>
          <span class="dlf-ellipsis">...</span>
          <span class="dlf-parenthesis">)</span>
        </div>          
        <div class="dlf-group-hover-visible dlf:gap-2 dlf:flex dlf:items-center">
          ${this.renderCommonActions()}
        </div>
      </div>
        
      <div class="dlf-group-body">
        <div class="dlf-group-body-conditions">
          ${children}
        </div>
        <div class="dlf-group-body-actions dlf:relative dlf:px-2 dlf-sortable-ignore">
          <div title="${trans('add-new')}" >
            <button class="dlf-icon-button" data-action="add-new">
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
    <span class="dlf-operator dlf-${operator}-operator" title="${tip}"
      data-value="${operator}">
      ${trans(["operator", operator])}
    </span>
    `;
  }

  private renderCondition(
    isNegated: boolean = false,
    condition?: LispyConditionExpr,
  ): string {
    let conditionInputContainerElem: string | undefined;
    
    if (condition) {
      const fields_lookup = condition[1].split("__");
      const fields = fields_lookup.slice(0, -1);
      const lookup = fields_lookup.slice(-1)[0];
      const value = condition[2];
      if (typeof value === 'object')  {
        // NOTE currently doesn't support custom function type
        throw new Error(`Currently doesn't support ${value} in LispyConditionExpr`);
      }

      conditionInputContainerElem = `
<div class="dlf-condition-input-container dlf:flex dlf:gap-2 dlf:items-center" >
  <div class="dlf-field-selector" data-initial-value="${fields}"></div>
  <div class="dlf-lookup-selector" data-initial-value="${lookup}"></div>
  <div class="dlf-value-input" data-initial-value="${value}"></div>
</div>
`;
    } else {
      conditionInputContainerElem = `
<div class="dlf-condition-input-container dlf:flex dlf:gap-2 dlf:items-center" >
  <div class="dlf-field-selector"></div>
  <div class="dlf-lookup-selector"></div>
  <div class="dlf-value-input"></div>
</div>
`;
    }
    
    return `
    <div class="dlf-condition dlf:group/condition dlf-sortable">
      ${isNegated ? this.renderOperator('not') : ""}
      ${conditionInputContainerElem}
      
      <div class="dlf:invisible dlf:group-hover/condition:visible dlf:gap-2 dlf:flex dlf:items-center">
        ${this.renderCommonActions()}
      </div>
    </div>
    `;
  }

  private renderCommonActions() {
    return `
<div title="${trans('delete')}">
  <button class="dlf-icon-button" data-action="delete">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      stroke-width="2.5" stroke="currentColor"
      class="dlf:size-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  </button>
</div>

<div title="${trans('toggle-not')}" >
  <button class="dlf-icon-button"
    data-action="toggle-not">${trans(["button-symbol", "N"])}
  </button>
</div>
`;
  }

  private setupEventListener() {
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
          case 'add-new':
            this.actionAddNew(btnElem);
            break;
          case 'delete':
            this.actionDelete(btnElem);
            break;
          case 'toggle-not':
            this.actionToggleNot(btnElem);
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

  private actionDelete(btnElem: HTMLElement) {
    let parentElem = btnElem.closest(".dlf-condition");
    if (!parentElem) {
      parentElem = btnElem.closest(".dlf-group")!;
    }
    parentElem.remove();

    if (!this.container.firstElementChild!.children.length) {
      this.render(["and"]);

      this.setupSortableForGroup(this.container.querySelector('.dlf-group-body-conditions')!);
    }
  }

  private actionAddNew(addNewBtnElem: HTMLElement) {
    const actionContainerElem = addNewBtnElem!.parentElement!.parentElement!;
    if (actionContainerElem.querySelector(".dlf-popup-menu")) return;
    
    const popupMenuElem = document.createElement("div");
    popupMenuElem.className = "dlf-popup-menu";
    popupMenuElem.innerHTML = `
<ul>
  <li><a data-action="add-new-and-group">${trans("add-new-and-group")}</a></li>
  <li><a data-action="add-new-or-group">${trans("add-new-or-group")}</a></li>
  <li><a data-action="add-new-condition">${trans("add-new-condition")}</a></li>
</ul>
`;

    const controller = new AbortController();

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
  
      if (!popupMenuElem.isConnected) return;

      const isClickInside = popupMenuElem.contains(target);
      const isAddButtonClick = addNewBtnElem.contains(target);

      if (!isClickInside && !isAddButtonClick) {
        popupMenuElem.remove();
        controller.abort();
      }
    };

    document.addEventListener('click', handleDocumentClick, { 
      signal: controller.signal 
    });

    
    popupMenuElem.querySelectorAll('a').forEach(menuItem => {
      menuItem.addEventListener('click', () => {
        const action = menuItem.getAttribute("data-action")!;
        const groupBodyConditionsElem = actionContainerElem.previousElementSibling! as HTMLElement;
        switch (action) {
          case 'add-new-and-group':
            this.addNewGroup('and', groupBodyConditionsElem);
            break;
          case 'add-new-or-group':
            this.addNewGroup('or', groupBodyConditionsElem);
            break;
          case 'add-new-condition':
            this.addNewCondition(groupBodyConditionsElem);
            break;
        }
        
        popupMenuElem.remove();
        controller.abort();
      }, { signal: controller.signal });
    });

    
    addNewBtnElem.parentElement!.insertAdjacentElement('afterend', popupMenuElem);
  }

  private addNewGroup(groupType: "and" | "or", groupBodyConditionsElem: HTMLElement) {
    const newGroupExpression: [typeof groupType] = [groupType];
    const newGroupRawHTML = this.renderExpression(newGroupExpression);
    groupBodyConditionsElem.insertAdjacentHTML('beforeend', newGroupRawHTML);

    const newGroupElem = groupBodyConditionsElem.lastElementChild!;
    this.setupSortableForGroup(newGroupElem.querySelector(".dlf-group-body-conditions")!);
  }

  private addNewCondition(groupBodyConditionsElem: HTMLElement) {
    const newConditionHTML = this.renderCondition();
    groupBodyConditionsElem.insertAdjacentHTML('beforeend', newConditionHTML);
    this.setupNewCascaderSelect();
  }

  private actionToggleNot(btnElem: HTMLElement) {
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
      parentElem.insertAdjacentHTML('afterbegin', this.renderOperator("not"));
    }
  }
  
  public toJson(): LispyExpression {
    const rootGroup = this.container.querySelector('.dlf-group') as HTMLElement;
    if (!rootGroup) {
      return ['and']; // Default empty expression
    }
    return this.parseGroup(rootGroup);
  }

  private parseGroup(groupElem: HTMLElement): LispyExpression {
    const operatorElems = groupElem.firstElementChild!.querySelectorAll('.dlf-operator');
    let isNegated = false;
    let operator: 'and' | 'or' = 'and';
    
    operatorElems.forEach(operatorElem => {
      const value = operatorElem.getAttribute("data-value")!;
      switch (value) {
        case 'not':
          isNegated = true;
          break;
        case 'and':
        case 'or':
          operator = value;
          break;
      }
    });

    // Parse all conditions and nested groups
    const groupBodyConditionsElem = groupElem.querySelector('.dlf-group-body-conditions')!;

    const children = Array.from(groupBodyConditionsElem.children)
      .filter(child => 
        child.classList.contains('dlf-condition') || 
        child.classList.contains('dlf-group')
      )
      .map(child => {
        if (child.classList.contains('dlf-condition')) {
          return this.parseCondition(child as HTMLElement);
        } else {
          return this.parseGroup(child as HTMLElement);
        }
      });

    const expression: LispyExpression = [operator, ...children];
    
    // Wrap in NOT if negated
    return isNegated ? ['not', expression] : expression;
  }

  
  private parseCondition(conditionElement: HTMLElement): LispyExpression {
    const isNegated = conditionElement.querySelector(".dlf-not-operator") ? true : false;

    const inputContainerElem =
          conditionElement.querySelector(".dlf-condition-input-container")!;
    const fieldSelectorDivElem = inputContainerElem.firstElementChild!;
    const lookupSelectorDivElem = inputContainerElem.children[1]!;
    const valueInputDivElem = inputContainerElem.lastElementChild!;

    const rawField = fieldSelectorDivElem.getAttribute("data-value");
    if (!rawField) {
      throw new Error("Field selector has not 'data-value` attribute!");
    }
    const fieldStr = rawField.replace(",", "__");

    const lookupSelectorElem = lookupSelectorDivElem.firstElementChild as HTMLSelectElement;
    if (!lookupSelectorElem) {
      throw new Error("Misses lookupSelectorElem!");
    }
    const lookupStr = lookupSelectorElem.value;

    const valueInputElem = valueInputDivElem.firstElementChild as HTMLInputElement;
    if (!valueInputElem) {
      throw new Error("Misses valueInputElem!");
    }
    
    const valueType = valueInputElem.type;
    let value: string | number | boolean = valueInputElem.value;

    // post-process value 
    switch (valueType) {
      case 'datetime-local':
        value = new Date(value).toISOString();
        break;
      case 'number':
        value = Number(value);
        break;
      case 'checkbox':
        value = value == 'on' ? true : false;
        break;
    }
    
    const condition: LispyConditionExpr = [
      '=', `${fieldStr}__${lookupStr}`, value
    ];
    
    return isNegated ? ['not', condition] : condition;
  }
}


