import { FilterEditorOptions, Group, Condition, Operator } from './types';

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
        this.container.innerHTML = this.generateHTML(this.root);
        this.container.classList.add('dlf-root-container');
    }

    private generateHTML(group: Group): string {
        const prefix = this.generateGroupPrefix(group);
        const children = group.children.map(child => {
            if (this.isGroup(child)) {
                return this.generateHTML(child);
            }
            return this.generateConditionHTML(child);
        }).join('');

        return `
            <div class="dlf-group dlf-expanded">
                ${prefix}
                <div class="dlf-indent">
                    ${children}
                </div>
                <div class="dlf-parenthesis">)</div>
            </div>
        `;
    }

    private generateGroupPrefix(group: Group): string {
        return `
            <div class="dlf-group-prefix">
                ${group.not ? '<span class="dlf-operator dlf-not-operator tooltip" data-tip="Not">Not</span>' : ''}
                <span class="dlf-operator dlf-${group.operator}-operator tooltip" data-tip="${group.operator}">${group.operator}</span>
                <span class="dlf-group-collapse">
                    <span class="dlf-parenthesis">(</span>
                    <span class="dlf-ellipsis">...</span>
                    <span class="dlf-parenthesis">)</span>
                </span>
            </div>
        `;
    }

    private generateConditionHTML(condition: Condition): string {
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

    // Public methods for manipulating the filter
    public addCondition(condition: Condition, parentGroupId?: string): void {
        // Implementation
    }

    public addGroup(parentGroupId?: string): void {
        // Implementation
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
