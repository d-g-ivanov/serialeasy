# Serialeasy

Easily convert form element data into a JavaScript object.

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

## Documentation

Details will follow soon.


## License

Serialeasy is licensed under the [MIT license](https://raw.github.com/joshfire/jsonform/master/LICENSE).
