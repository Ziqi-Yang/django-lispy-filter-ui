async function fetchSchema(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    return json;
}



async function setUpFilterEditor(
  getSchemaApiUrl: string,
  mainModel: string,
) {
    const containerElem = document.getElementById("django-lispy-filter-editor");
    if (!containerElem) throw new Error("Canot find element with id `django-lispy-filter-editor`!")
    
    const schema = await fetchSchema(getSchemaApiUrl);
    
    for (const [key, value] of Object.entries(schema.models[mainModel])) {
        console.log(key, value);
    }
}
