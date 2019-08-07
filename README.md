# Serialeasy

Easily convert form element data into a JavaScript object. No dependencies or additional libraries required.

## Install

Download the serialEASY.js file and include it in your HTML file using a script tag.

```html
<script type="text/javascript" src="serialEASY.js"></script>
```

## Usage

Serialeasy utilizes a custom data attribute added to each form field with a description of how to serialize the data into the final object.

```html
<div id='form-elements'>
	<input type="text" id='width-check-1' data-structure='sections[1]-errorChecking{}-width' value='1000' />
	<input type="text" id='height-check-1' data-structure='sections[1]-errorChecking{}-height' value='500' />
</div>

<script type="text/javascript" src="serialEASY.js"></script>

<script>
	var elements = document.getElementById('form-elements').querySelectorAll('input');

	var data = serialeasy().serialize(elements);
	
	/*
	{
		sections: [
			undefined,
			{
				errorChecking: {
					width: "1000",
					height: "500"
				}
			}
		]
	}
	*/
</script>
```

## Syntax

Everything starts with an empty object that is being fillwed out based on provided template string. The template string represents the path within the final serialized object where the value of the input should be placed.

For example,
```html
     1		  2	      3
sections[1]-errorChecking{}-width


// { sections: [ undefined, { errorChecking: { width: < value goes here > } } ] }
```

The above is read in the following manner with '-' as a delimiter:
1. add a key named 'sections' that has a value of an Array. I want to fill out index 1 of that array.
2. at index 1, place an object that has a key 'errorChecking' with a value of an Object.
3. this errorchecking object should have a key called 'width' and that is it.
4. the final 'width' key should have a value of whatever the input's value is.


### Further breakdown

```html sections{} ``` - means create a key called 'sections' whose value is an object.  
```html sections[] ``` - means create a key called 'sections' whose value is an array. I will be pushing things into the array. If nothing follows the expression, it will push the value of the input into the array. If the expression is followed by a string, it will push the string onto the array. If it is followed by another expression, it will push an empty object into the array and process the enxt command.  
```html sections[index] ``` - means create a key called 'sections' whose value is an array. I want to work with <index> element of the array. If that index is empty, please place an empty object in it.  


## API

```html serialeasy.serialize(elements) ```
Takes in a collection of HTML form elements, or the result of the unserialize function (see below), and extracts the information from them into a JavaScript object.

```html serialeasy.unserialize(elements) ```
Takes in a JavaScript object and transforms it into an 2D array where:
 - first item is path to the value within the object. I.e., it is the text you need to put in the data attributed to re-create the obejct from a for input.
 - the second item is the value itself.

```html
var data = {
  a: { b: 3 },
  c: [ 1, 2]
};

// returns
[
  ["a{}-b", 3],
  ["c[]", 1],
  ["c[]", 2]
]
```

```html serialeasy.setOptions(options) ```
Takes in an object and merges that with the default settings. The method is chainable meaning that you can set the options and call the serialize method one after the other.

```html
var data = serialeasy().setOptions(options).serialize(elements);
```

Possible option keys:

dataset - sets the name of the data attribute to be used for the template string. Defaults to 'structure'.
	- needed only for serialize function when HTML elements are passed to it.

```html
var data = serialeasy().setOptions({ dataset: 'template'});
// serialize function will search for the template string within data-template attribute
```

delimiter - defines the separator used within the template string. Defauls to a dash ('-').
	  - needed for both serialize and unserialize functions.

```html
var data = serialeasy().setOptions({ delimiter: '.'});
// serialize function will expect that the tempalte string looks something like this: sections[0].errorChecking{}-width
```

mergeArrays - BOOLEAN, allows you to specify whether it should try and merge values within arrays when indeces are specified. Experimental. Defaults to 'true'.
	    - needed only for the serialize function. 

```html
var data = serialeasy().setOptions({ delimiter: '.'});
// serialize function will expect that the tempalte string looks something like this: sections[0].errorChecking{}-width
```

shouldIndex - instructs whether the resulting structure string should include index number. If no index is provided, the serialize function might not merge objects in arrays properly.
	    - needed only for the unserialize function.
	    - possible values for this are:
	    	- never - never add indeces, no matter what
		- always - always add indeces, no matter what
		- default - i.e. any other value or missing - tries to be smart about the indeces and adds them only when the value within the array might require merging.

preprocess - this should be a function that will be run after the structure and values have been collected form the HTML form elements, or unserialize data. Its purpose is to give you the chance to alter either the structure, or the values before the final object is constructed. For example, you can transform values to numbers, or cleanup unnecessary levels.
	   - needed only for the serialize function.
	   - takes is a data element (to be described soon) and should return the transformed data parameter with the internal structure as the one passed.

The data parameter passed to the function has the following internal structure:

```html
{
  original: null, // string, the same as what you will put in the data attribute of the HTML element
  structure: null, // array of strings, it is the original value above split using the delimiter option
  value: null // the extracted value from the HTML element, or unserialeasy result
}
```

collectAllValues - boolean option that suggests whether falsy values from the HTML elements should be included i nthe final object. Default is false (do not collect false values)
	   	 - needed only for the serialize function.

## License

Serialeasy is licensed under the [MIT license](https://raw.github.com/joshfire/jsonform/master/LICENSE).
