console.log("START");

//IDEAS
//ADD OBJECT FIELD
//LINE Number
//WRAP OBJECT/Array
//CROP STRING
//COPY PASTE
//INDENTATION MARKER

var DEFAULT_BOOLEAN_VALUE = true;
var DEFAULT_STRING_VALUE = "";
var DEFAULT_NUMBER_VALUE = 0;

var showNullValues = true; //todo button to change + reDraw json

var model;
var modelMap;

var rootObject;
var importedObject;

var htmlIdCount = 0;
var htmlIdToObject = {};

var selectedHtmlId;

main();

function main () {
	initModel();
	console.log(model);
	
	rootObject = createObjectStruct(null);
	
	document.getElementById("buttonImport").onclick = importObject;
	
	updateJSONView();
	updateInterfaceView();
}

function importObject() {
	var fileInput = document.getElementById('file-input');
	var file = fileInput.files[0];
	if (!file) {
		alert("Aucun fichier spécifié");
		return;
	}
	
	var reader = new FileReader();
	reader.onload = function(e) {
		var contents = e.target.result;
		loadObject(contents);
		//TODO remove LOADING
	};
	//TODO LOADING
	reader.readAsText(file);
}

function loadObject(objectSTR) {
	var object = JSON.parse(objectSTR);
	console.log(object);
	rootObject = createObjectStruct(object);
	
	console.log("new rootObject");
	console.log(rootObject);
	
	
	selectedHtmlId = null;
	updateJSONView();
	updateInterfaceView();
}

function updateJSONView() {
	var htmlToDisplay = getObjectDisplay(rootObject, 0);
	var objectDisplayArea = document.getElementById("ObjectDisplayArea");
	objectDisplayArea.innerHTML = htmlToDisplay;
	highlightSelectedElement();
}

function initModel() {
	model = [];
	modelMap = {};
	for (var i = 0; i < rawModel.length; i++) {
		//ClassName
		var className = rawModel[i];
		var separatedClassName = className.split("\.");
		var shortClassName = separatedClassName[separatedClassName.length - 1];
		i++;
		
		//Fields
		var fields = [];
		var fieldList = rawModel[i]
		for (var j = 0; j < rawModel[i].length; j++) {
			var fieldName = rawModel[i][j];
			j++;
			var fieldType = rawModel[i][j];
			fields.push({name:fieldName, type:fieldType});
		}
		
		model.push({className:className, shortClassName:shortClassName, fields:fields});
		modelMap[className] = model[(i - 1) / 2];
	}
}

function objectClicked(event) {
	event.stopPropagation();
	console.log(event);
	var clickedElement = getWrapperElement(event.target);//srcElement);
	
	selectedHtmlId = clickedElement.id;
	highlightSelectedElement();
	
	var object = htmlIdToObject[clickedElement.id];
	if (object === undefined) {
		console.log("Pas d'objet défini pour l'id : " + clickedElement.id);
		return;
	}
	
	updateInterfaceView();
}

function updateInterfaceView() {
	var object = htmlIdToObject[selectedHtmlId];
	var htmlToDisplay;
	console.log("AAAAAAAAAAAAAAAAAAAAA");
	console.log(object);
	if (object === null || object === undefined) {
		htmlToDisplay = "<p>No Selection</p>";
	} else {
		htmlToDisplay = getObjectInterface(object);
	}
	var interfaceDisplayArea = document.getElementById("InterfaceDisplayArea");
	interfaceDisplayArea.innerHTML = htmlToDisplay;
}

function highlightSelectedElement() {
	var objectContainers = document.querySelectorAll(".selectedObject");
	if (objectContainers.length > 0) {
		objectContainers[0].classList.remove("selectedObject");
	}
	
	element = document.getElementById(selectedHtmlId);
	if (element !== null && element !== undefined)// l'élément disparait après un import
		element.className += element.className ? ' selectedObject' : 'selectedObject';
}

function getWrapperElement(element) {
	while (element != null){
		if (element.id !== null && element.id !== "") {
			return element;
		}
		element = element.parentElement;
	}
}


/*_____STRUCT_____*/

function createObjectStruct(object) {
	var struct;
	if (object === null) {
		struct = createNullStruct();
	} else if (object instanceof Array) {//Array.isArray() ?
		struct = createArrayStruct(object);
	} else if (isString(object)) {
		struct = createStringStruct(object);
	} else if (isBoolean(object)) {
		struct = createBooleanStruct(object);
	} else if (isNumber(object)) {
		struct = createNumberStruct(object);
	} else if (object instanceof Object) {
		struct = createBasicTravauxObjectStruct(object);
	} else {
		console.log("type not regconized for object " + object);
	}
	struct["htmlId"] = getNextHtmlId(struct);
	return struct;
}

function getNextHtmlId(object) {
	var htmlId = "id-" + htmlIdCount;
	htmlIdCount += 1;
	htmlIdToObject[htmlId] = object;
	return htmlId;
}

function isString(object) {
	return (object instanceof String) || ((typeof object) === "string");
}
function isNumber(object) {
	return (object instanceof Number) || ((typeof object) === "number");
}
function isBoolean(object) {
	return (object instanceof Boolean) || ((typeof object) === "boolean");
}

function createNullStruct() {
	return {type:"null"};
}

function createNumberStruct(object) {
	return {type:"number", value:object};
}

function createBooleanStruct(object) {
	return {type:"boolean", value:object};
}

function createStringStruct(object) {
	return {type:"string", value:object};
}

/*{
	typpe:"",
	id:"",
	code:"",
	etats:[],
	source:{}
}*/

function createBasicTravauxObjectStruct(object) {//rename JavaObject ?
	var fields = [];
	
	var className = object["__type"] === undefined ? object["@type"] : object["__type"];
	var clazz = modelMap[className];
	
	if (clazz === undefined) { //Objets sans classe 
		entries = Object.entries(object);//[[],[]]
		for (var i = 0; i < entries.length; i++) {
			var entry = entries[i];
			var field = {name:entry[0], type:undefined, value:createObjectStruct(entry[1])}; // /!\ type undefined
			fields.push(field);
		}
	} else {
		var typeFieldValue = createObjectStruct(className);
		fields.push({name:"__type", type:"java.lang.String", value:typeFieldValue}); //TODO __type or @type ??
		for (var i = 0; i < clazz.fields.length; i++) {// TODO get id et dateCreation first
			var classField = clazz.fields[i];
			var fieldValue = object[classField.name] === undefined ? createObjectStruct(null) : createObjectStruct(object[classField.name]);
			var field = {name:classField.name, type:classField.type, value:fieldValue};
			fields.push(field);
		}
	}
	
	var objectStruct = {
		type:"basicTravauxObject",
		className:className, //surtout pour les events onclick
		fields:fields
	}
	return objectStruct;
}

function createArrayStruct(object) {
	var value = [];
	for (var i = 0; i < object.length; i++) {
		value.push(createObjectStruct(object[i]));
	}
	var arrayStruct = {
		type:"array",
		value:value
	}
	return arrayStruct;
}


/*_____INTERFACE_____*/

function getObjectInterface(object) {
	console.log(object);
	
	var objectHtml = "";
	if (object.type === "null") {
		objectHtml += getNullInterface(object);
	} else if (object.type === "number") {
		objectHtml += getNumberInterface(object);
	} else if (object.type === "boolean") {
		objectHtml += getBooleanInterface(object);
	} else if (object.type === "string") {
		objectHtml += getStringInterface(object);
	} else if (object.type === "basicTravauxObject") {
		objectHtml += getBasicTravauxObjectInterface(object);
	} else if (object.type === "array") {
		objectHtml += getArrayInterface(object);
	} else {
		console.log("type undefined : " + object.type);
		console.log(object);
	}
	objectHtml += "";
	return objectHtml;
}

function getNullInterface(object) {
	var interfaceHtml = "<p>Null " + object.htmlId + "</p></br>";
	
	interfaceHtml += "<button onclick=\"toNumber('" + object.htmlId + "')\">To Number</button></br>";
	interfaceHtml += "<button onclick=\"toBoolean('" + object.htmlId + "')\">To Boolean</button></br>";
	interfaceHtml += "<button onclick=\"toString2('" + object.htmlId + "')\">To String</button></br>";
	interfaceHtml += "<button onclick=\"toObject('" + object.htmlId + "')\">To Object</button></br>";
	interfaceHtml += "<button onclick=\"toArray('" + object.htmlId + "')\">To Array</button></br>";
	interfaceHtml += "</br>";
	
	interfaceHtml += "<p>To BasicTravaux Object</p>";
	interfaceHtml += getBTObjectsList();
	interfaceHtml += "</br><button onclick=\"toBasicTravauxObject('" + object.htmlId + "')\">To BasicTravauxObject</button>"
	
	return interfaceHtml;
}

function getBTObjectsList() {
	var html = "<input id=\"input-class-value\" list=\"classes\"><datalist id=\"classes\" size=\"5\">";
	for (var i = 0; i < model.length; i++) {
		var clazz = model[i];
		html += "<option value=\"" + clazz.className + "\">";
	}
	html += "</datalist>";
	return html;
}

function getNumberInterface(object) {
	var interfaceHtml = "<p>Number " + object.htmlId + "</p></br>";
	
	interfaceHtml += "<button onclick=\"toNull('" + object.htmlId + "')\">To Null</button></br>";
	interfaceHtml += "</br>";
	interfaceHtml += "<input id=\"input-number-value\" value=\"" + object.value + "\"></input>";
	interfaceHtml += "<button onclick=\"toNumberValue('" + object.htmlId + "')\">Update</button></br>";
	
	return interfaceHtml;
}

function getBooleanInterface(object) {
	var interfaceHtml = "<p>Boolean " + object.htmlId + "</p></br>";
	
	interfaceHtml += "<button onclick=\"toNull('" + object.htmlId + "')\">To Null</button></br>";
	interfaceHtml += "</br>";
	interfaceHtml += "<button onclick=\"toTrue('" + object.htmlId + "')\">True</button></br>";
	interfaceHtml += "<button onclick=\"toFalse('" + object.htmlId + "')\">False</button></br>";
	
	return interfaceHtml;
}

function getStringInterface(object) {
	var interfaceHtml = "<p>String " + object.htmlId + "</p></br>";
	
	interfaceHtml += "<button onclick=\"toNull('" + object.htmlId + "')\">To Null</button></br>";
	interfaceHtml += "</br>";
	interfaceHtml += "<input id=\"input-string-value\" value=\"" + object.value + "\"></input>";
	interfaceHtml += "<button onclick=\"toStringValue('" + object.htmlId + "')\">Update</button></br>";
	interfaceHtml += "</br>";
	interfaceHtml += "<button onclick=\"toUUID('" + object.htmlId + "')\">Generate UUID</button></br>";
	
	return interfaceHtml;
}

function getBasicTravauxObjectInterface(object) {
	var interfaceHtml = "<p>Object " + object.htmlId + "</p></br>";
	
	interfaceHtml += "<button onclick=\"toNull('" + object.htmlId + "')\">To Null</button></br>";
	interfaceHtml += "</br>";
	
	interfaceHtml += "<input id=\"input-field-name-value\"></input>";
	interfaceHtml += "<button onclick=\"addField('" + object.htmlId + "')\">Add Field</button></br>";
	interfaceHtml += "</br>";
	
	interfaceHtml += "<p>Fields</p>";
	if (object.fields.length === 0) {
		interfaceHtml += "<span>no fields ...</span></br>";
	} else {
		for (var i = 0; i < object.fields.length; i++) {
			var field = object.fields[i];
			interfaceHtml += "<span>" + field.name + "</span></br>";
			interfaceHtml += "<span>" + field.type + "</span></br>";//model Type
			interfaceHtml += "<button onclick=\"removeField('" + object.htmlId + "', " + i + ")\">Delete</button></br></br>"
		}
	}
	
	return interfaceHtml;
}

function getArrayInterface(object) {
	var interfaceHtml = "<p>Array " + object.htmlId + "</p></br>";
	
	interfaceHtml += "<button onclick=\"toNull('" + object.htmlId + "')\">To Null</button></br>";
	interfaceHtml += "</br>";
	
	interfaceHtml += "<button onclick=\"addElement('" + object.htmlId + "')\">Add Element</button></br>";
	interfaceHtml += "</br>";
	
	interfaceHtml += "<p>Elements</p>";
	if (object.value.length === 0) {
		interfaceHtml += "<span>no elements ...</span></br>";
	} else {
		for (var i = 0; i < object.value.length; i++) {
			var element = object.value[i];
			interfaceHtml += "<span>" + i + " - " + element.type + "</span></br>";
			interfaceHtml += "<button onclick=\"removeElement('" + object.htmlId + "', " + i + ")\">Delete</button></br></br>"
		}
	}
	
	return interfaceHtml;
}

/*operations*/
function toBasicTravauxObject(htmlId) {
	var classNameInput = document.getElementById("input-class-value");
	var className = classNameInput.value;
	console.log(className);
	
	var clazz = modelMap[className];
	if (clazz === null || clazz === undefined) {
		alert(className + " is not a valid BasicTravaux class");
		return;
	}
	console.log(clazz);
	
	var struct = htmlIdToObject[htmlId];
	deleteObjectAttributes(struct);
	
	struct.className = className;
	struct.type = "basicTravauxObject";
	
	var fields = [];
	fields.push({name:"__type", type:"java.lang.String", value:createObjectStruct(className)});
	for (var i = 0; i < clazz.fields.length; i++) {
		var classField = clazz.fields[i];
		var field = {name:classField.name, type:classField.type, value:createObjectStruct(null)}
		fields.push(field);
	}
	struct.fields = fields;
	
	updateJSONView();
	updateInterfaceView();
}

function removeElement(htmlId, elementIndex) {
	var struct = htmlIdToObject[htmlId];
	struct.value.splice(elementIndex, 1);
	updateJSONView();
	updateInterfaceView();
	//TODO clean deleted sons from htmlIdToObject & other places...
}
function addElement(htmlId) {
	var struct = htmlIdToObject[htmlId];
	struct.value.push(createObjectStruct(null));
	updateJSONView();
	updateInterfaceView();
}

function removeField(htmlId, fieldIndex) {
	var struct = htmlIdToObject[htmlId];
	struct.fields.splice(fieldIndex, 1);
	updateJSONView();
	updateInterfaceView();
	//TODO clean deleted sons from htmlIdToObject & other places...
}
function addField(htmlId) {
	var fieldNameInput = document.getElementById("input-field-name-value");
	var inputValue = fieldNameInput.value;
	var struct = htmlIdToObject[htmlId];
	struct.fields.push({name:inputValue, value:createObjectStruct(null)});
	updateJSONView();
	updateInterfaceView();
}

function toUUID(htmlId) {
	function guid() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
			  .toString(16)
			  .substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
			s4() + '-' + s4() + s4() + s4();
	}
	toValue(htmlId, guid());
}
function toStringValue(htmlId) {//TODO escape special characters (JSON format)
	var stringInput = document.getElementById("input-string-value");
	var inputValue = stringInput.value;
	toValue(htmlId, inputValue);
}
function toNumberValue(htmlId) {
	var numberInput = document.getElementById("input-number-value");
	var inputValue = numberInput.value;
	
	inputValue = parseFloat(inputValue);
	if (Number.isNaN(inputValue)) {
		alert(inputValue + " is not a valid number.");
		return;
	}
	toValue(htmlId, inputValue);
}
function toTrue(htmlId) {
	toValue(htmlId, true);
}
function toFalse(htmlId) {
	toValue(htmlId, false);
}
function toValue(htmlId, value) {
	var struct = htmlIdToObject[htmlId];
	struct.value = value;
	updateJSONView();
	updateInterfaceView();
}

function toNull(htmlId) {
	toType(htmlId, null);
}
function toNumber(htmlId) {
	toType(htmlId, DEFAULT_NUMBER_VALUE);
}
function toBoolean(htmlId) {
	toType(htmlId, DEFAULT_BOOLEAN_VALUE);
}
function toString2(htmlId) { //function toString is part of javascript language
	toType(htmlId, DEFAULT_STRING_VALUE);
}
function toObject(htmlId) {
	toType(htmlId, {});
}
function toArray(htmlId) {
	toType(htmlId, []);
}
function toType(htmlId, value) {
	var struct = htmlIdToObject[htmlId];
	deleteObjectAttributes(struct);
	setObjectAttributes(struct, Object.entries(createObjectStruct(value)));
	updateJSONView();
	updateInterfaceView();
	//TODO clean deleted sons from htmlIdToObject & other places...
}

function deleteObjectAttributes(object) {
	var keys = Object.keys(object);
	for (var i = 0; i < keys.length; i++) {
		if (keys[i] !== "htmlId")
			delete object[keys[i]];
	}
}
function setObjectAttributes(object, entries) {
	for (var i = 0; i < entries.length; i++) {
		if (entries[i][0] !== "htmlId")
			object[entries[i][0]] = entries[i][1];
	}
}


/*_____DISPLAY_____*/

function getObjectDisplay(object, indentLevel) {// TODO arrays
	var objectHtml = "<span id=\"" + object["htmlId"] + "\" class=\"objectContainer\" onclick=\"objectClicked(event)\">";
	
	/*if (object === undefined)//TODO hack à corriger
		return;*/
	
	/*if (object.type === undefined) { // pour les objets dont la classe n'est pas renseignée
		object.type = getObjectType(object);
	}*/

	
	if (object.type === "null") {
		objectHtml += getNullDisplay(object, indentLevel);
	} else if (object.type === "number") {
		objectHtml += getNumberDisplay(object, indentLevel);
	} else if (object.type === "boolean") {
		objectHtml += getBooleanDisplay(object, indentLevel);
	} else if (object.type === "string") {
		objectHtml += getStringDisplay(object, indentLevel);
	} else if (object.type === "basicTravauxObject") {
		objectHtml += getBasicTravauxObjectDisplay(object, indentLevel);
	} else if (object.type === "array") {
		objectHtml += getArrayDisplay(object, indentLevel);
	} else {
		console.log("type undefined : " + object.type);
		console.log(object);
	}
	objectHtml += "</span>";
	return objectHtml;
}

function getObjectType(object) {
	if (object === null) {
		return "null";
	} else if (object instanceof Array) {//Array.isArray() ?
		return "array";
	} else if (isString(object)) {
		return "string";
	} else if (isBoolean(object)) {
		return "boolean";
	} else if (isNumber(object)) {
		return "number";
	} else if (object instanceof Object) {
		return "basicTravauxObject";
	}
	return undefined;
}

function getNullDisplay(object, indentLevel) {
	return "<span class=\"nullObject\">null</span>";
}

function getNumberDisplay(object, indentLevel) {
	return "<span class=\"numberObject\">" + object.value + "</span>";
}
function getBooleanDisplay(object, indentLevel) {
	return "<span class=\"booleanObject\">" + object.value + "</span>";
}
function getStringDisplay(object, indentLevel) {
	return "<span class=\"stringObject\">\"" + object.value + "\"</span>";
}

function getBasicTravauxObjectDisplay(object, indentLevel) {
	var objectHtml = "<span>{</span>";
	objectHtml += "<br>";
	for (var i = 0; i < object.fields.length; i++) {
		var field = object.fields[i];
		if (showNullValues || field.value.type !== "null") {
			objectHtml += getIndentationDisplay(indentLevel + 1);
			objectHtml += "<span>\"" + field.name + "\"</span>";
			objectHtml += "<span>" + ":" + "</span>";
			objectHtml += getObjectDisplay(field.value, indentLevel + 1);
			
			if (i != object.fields.length - 1) {
				objectHtml += "<span>" + "," + "</span>";
			}
			objectHtml += "</br>";
		} else {
			if (i === object.fields.length - 1) {
				objectHtml = objectHtml.substring(0, objectHtml.length - 19);
				objectHtml += "</br>";
			}
		}
	}
	objectHtml += getIndentationDisplay(indentLevel) + "<span>}</span>";
	return objectHtml;
}

function getArrayDisplay(object, indentLevel) {
	var objectHtml = "<span>[</span>";
	objectHtml += "<br>";
	for (var i = 0; i < object.value.length; i++) {
		objectHtml += getIndentationDisplay(indentLevel + 1);
		objectHtml += getObjectDisplay(object.value[i], indentLevel + 1);
		if (i != object.value.length - 1) {
			objectHtml += "<span>" + "," + "</span>";
		}
		objectHtml += "</br>";
	}
	objectHtml += getIndentationDisplay(indentLevel) + "<span>]</span>";
	return objectHtml;
}

function getIndentationDisplay(indentLevel) {
	var objectHtml = "<span>";
	for (var i = 0; i < indentLevel; i++) {
		objectHtml += "    ";
	}
	objectHtml += "</span>";
	return objectHtml;
}