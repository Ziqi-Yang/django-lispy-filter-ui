import type { FilterEditorOptions, Group, Condition, Operator } from './types';

// export async function fetchSchema(url: string) {
//     const response = await fetch(url);
//     if (!response.ok) {
//         throw new Error(`Response status: ${response.status}`);
//     }

//     const json = await response.json();
//     return json;
// }



// export async function setUpFilterEditor(
//   getSchemaApiUrl: string,
//   mainModel: string,
// ) {
//     const containerElem = document.getElementById("django-lispy-filter-editor");
//     if (!containerElem) throw new Error("Canot find element with id `django-lispy-filter-editor`!")
    
//     const schema = await fetchSchema(getSchemaApiUrl);
    
//     for (const [key, value] of Object.entries(schema.models[mainModel])) {
//         console.log(key, value);
//     }
// }


export class FilterEditor {
  private container: HTMLElement;
  private options: FilterEditorOptions;
  private root: Group;

  constructor(options: FilterEditorOptions) {
    this.options = options;
    this.container = typeof options.container === 'string' 
      ? document.querySelector(options.container)! 
      : options.container;
        
    this.root = options.initialValue || {
      operator: 'and',
      children: []
    };

    this.init();
  }

  private init(): void {
    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.innerHTML = `
    <div class="dlf-root-container">
      ${this.renderGroup(this.root)}
    </div>
    `;
  }

  private renderGroup(group: Group): string {
    const children = group.children.map(child => {
      if (this.isGroup(child)) {
        return this.renderGroup(child);
      }
      return this.renderCondition(child);
    }).join('');
    
    return `
    <div class="dlf-group dlf-expanded">
      <div class="dlf-group-prefix">
        ${group.not ? '<span class="dlf-operator dlf-not-operator tooltip" data-tip="Not">Not</span>' : ''}
        <span class="dlf-operator dlf-${group.operator}-operator tooltip" data-tip="${group.operator}">${group.operator}</span>
        <div class="dlf-group-collapse">
          <span class="dlf-parenthesis">(</span>
          <span class="dlf-ellipsis">...</span>
          <span class="dlf-parenthesis">)</span>
        </div>
      </div>
        
      <div class="dlf-indent">
        ${children}
      </div>
      <div class="dlf-parenthesis">)</div>
    </div>
    `;
  }
  

  private renderCondition(condition: Condition): string {
    return `
    <div class="dlf-condition group">
     ${condition.not ? '<span class="dlf-operator dlf-not-operator tooltip" data-tip="Not">Not</span>' : ''}
     <span>${condition.field} ${condition.operator} ${condition.value}</span>
     <button class="hidden group-hover:flex btn btn-xs btn-circle">
       <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
       </svg>
     </button>
    </div>
    `;
  }

  private attachEventListeners(): void {
    // Toggle expand/collapse
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.dlf-group-collapse')) {
        const group = target.closest('.dlf-group');
        if (group) {
          group.classList.toggle('dlf-expanded');
        }
      }
    });

    // Add condition button handler
    // Delete condition button handler
    // Toggle operator button handler
    // etc.
  }

  public addCondition(parentGroupId: string): void {
    const group = this.findGroupById(parentGroupId);
    if (!group) throw new Error(`Group ${parentGroupId} not found`);

    const newCondition: Condition = {
      id: this.generateId(),
      type: 'condition',
      not: false,
      field: this.options.fields[0].name,
      operator: this.options.fields[0].operators[0],
      value: ''
    };

    group.children.push(newCondition);
    this.render();
    this.notifyChange();
  }

  public addGroup(parentGroupId: string): void {
    const group = this.findGroupById(parentGroupId);
    if (!group) throw new Error(`Group ${parentGroupId} not found`);

    const newGroup: Group = {
      id: this.generateId(),
      type: 'group',
      not: false,
      operator: 'and',
      children: []
    };

    group.children.push(newGroup);
    this.render();
    this.notifyChange();
  }

  public removeNode(nodeId: string): void {
    const removeFromGroup = (group: Group) => {
      const index = group.children.findIndex(child => child.id === nodeId);
      if (index !== -1) {
        group.children.splice(index, 1);
        return true;
      }
      return group.children.some(child => 
        child.type === 'group' && removeFromGroup(child)
      );
    };

    removeFromGroup(this.root);
    this.render();
    this.notifyChange();
  }

  private generateId(): string {
    return `node_${Math.random().toString(36).substr(2, 9)}`;
  }

  private findGroupById(id: string): Group | null {
    const find = (group: Group): Group | null => {
      if (group.id === id) return group;
      for (const child of group.children) {
        if (child.type === 'group') {
          const found = find(child);
          if (found) return found;
        }
      }
      return null;
    };
    return find(this.root);
  }

  private notifyChange(): void {
    this.options.onChange?.(this.root);
  }
  
  public removeCondition(conditionId: string): void {
    // Implementation
  }

  public toggleNot(itemId: string): void {
    // Implementation
  }

  public changeOperator(groupId: string, operator: Operator): void {
    // Implementation
  }

  private isGroup(item: any): item is Group {
    return 'children' in item;
  }

  public getValue(): Group {
    return this.root;
  }
}
