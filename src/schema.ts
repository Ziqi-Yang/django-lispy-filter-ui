import { isSchemaField, type Schema, type SchemaField } from './types';
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

export function getField(
  fieldNames: string[],
  mainModel: string,
  modelsSchema: Schema['models']
): SchemaField {
  if (fieldNames.length === 0) {
    throw new Error("fieldNames array must not be empty");
  }

  let curModel = modelsSchema[mainModel];

  for (let index = 0; index < fieldNames.length; index++) {
    const fieldName = fieldNames[index];
    if (index !== fieldNames.length - 1) {
      if (curModel[fieldName]) {
        throw new Error(`Field '${fieldName}' should not be a SchemaField in model`);
      }
      const nextModel = modelsSchema[fieldName];
      if (!nextModel) {
        throw new Error(`Model '${fieldName}' not found in schema`);
      }
      curModel = nextModel;
    } else {
      const field = curModel[fieldName];
      if (!isSchemaField(field)) {
        throw new Error(`Wrong schema! '${fieldName}' should be a SchemaField`);
      }
      return field;
    }
  }

  throw new Error("Unexpected end of function execution");
}
