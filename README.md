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
	1			2			3
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
Takes in a collection of HTML form elements and extract the information from them.

```html serialeasy.setOptions(options) ```
Takes in an object and merges that with the default settings. The method is chainable meaning that you can set the options and call the serialize method one after the other.

```html
var data = serialeasy().setOptions(options).serialize(elements);
```

Possible option keys:

dataset - sets the name of the data attribute to be used for the template string. Defaults to 'structure'.

```html
var data = serialeasy().setOptions({ dataset: 'template'});
// serialize function will search for the template string within data-template attribute
```

delimiter - defines the separator used within the template string. Defauls to a dash ('-').

```html
var data = serialeasy().setOptions({ delimiter: '.'});
// serialize function will expect that the tempalte string looks something like this: sections[0].errorChecking{}-width
```

mergeArrays - BOOLEAN, allows you to specify whether it should try and merge values within arrays when indeces are specified. Experimental. Defaults to 'true'.

```html
var data = serialeasy().setOptions({ delimiter: '.'});
// serialize function will expect that the tempalte string looks something like this: sections[0].errorChecking{}-width
```


## License

Serialeasy is licensed under the [MIT license](https://raw.github.com/joshfire/jsonform/master/LICENSE).
