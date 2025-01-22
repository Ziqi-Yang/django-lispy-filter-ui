import { isSchemaField, type Schema } from './types';
import type { CascaderOptionsData } from 'cascaderjs';


/**
 * Get all fields from schema.
 * `all` means considering foreign key.
 */
export function genFieldsListFromSchema(
  curModelName: string,
  models: Schema['models'],
  modelsInChain: Set<string> = new Set(),
) {
  const res: CascaderOptionsData[] = [];
  const curModel = models[curModelName];
  if (!curModel) return res;
  modelsInChain.add(curModelName);

  const relatedModels = curModel['__rel'];

  // make related model appear first
  relatedModels.forEach(modelName => {
    // to prevent circle (and in real scenario, circle means extra duplicate steps)
    if (!modelsInChain.has(modelName)) {
      const model = models[modelName];
      if (model) {
        res.push({
          'value': modelName,
          'label': model['__verbose_name'],
          'children': genFieldsListFromSchema(modelName, models, new Set(modelsInChain).add(modelName))
        })
      }
    }
  })

  for (const [field, properties] of Object.entries(curModel)) {
    if (field === '__rel' || field === '__verbose_name') continue;
    if (!isSchemaField(properties)) {
      throw new Error(`Wrong schema! ${properties} should be of SchemaField type!`);
    }
    
    res.push({
      'value': field,
      'label': properties['verbose_name']
    });
  }
  
  return res;
}
