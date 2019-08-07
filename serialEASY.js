var serialeasy = (function() {

	var options = {
		dataset: 'structure',
		delimiter: '-',
		mergeArrays: true,
		shouldIndex: 'default',
		preprocess: null,
		collectAllValues: false
	};
	
	var keyRegEx = /\[+(.*?)\]+|\{.*?\}/g;
	var modifierRegEx = /\[+(.*?)\]+|\{.*?\}/i; // use match, 0 is brackets, 1 is number or '', if any

	/* helpers */
	function setOptions(opts) {
		Object.assign(options, opts);
		// console.log(options);
		return this;
	}

	function isObject(entity) { return entity && entity instanceof Object && !Array.isArray(entity); }
	
	function isArray(entity) { return entity && Array.isArray(entity); }

	function isValidIndex(entry) { return entry && entry !== null && entry !== undefined; }

	function isElement(entity){
		return (
		  typeof HTMLElement === "object" ? entity instanceof HTMLElement : //DOM2
		  entity && typeof entity === "object" && entity !== null && entity.nodeType === 1 && typeof entity.nodeName==="string"
	  );
	}
	

	/* UNSERIALEASY */
	function js2strings(data) {
		//validate data
		if ( typeof data === 'string' ) {
			try {
				data = JSON.parse(data);
			} catch (err) {
				throw new Error('Provided data is not a proper JSON string. Data:\n\n' + data);
			}
		} else if ( isObject(data) ) {
			data = data;
		} else {
			throw new Error('Cannot use the provided data.\n\n' + data);
		}
		
		//split into array and return to caller
		return isArray(data) ? splitArrayToString(data) : splitObjectToString(data);
	}

	function splitArrayToString(data, prevValue) {
		//data is array
		//prevValue is a string
		return data.reduce( (final, datum, index) => {
			let isobject = isObject(datum),
				isarray = isArray(datum)
				result = prevValue || '';

			if (isobject) {
				options.shouldIndex === 'never' ? result += '[]' : result += '[' + index + ']';
				// return [...final, ...splitObjectToString(datum, result)];
				return final.concat( splitObjectToString(datum, result) );
			} else if (isarray) {
				options.shouldIndex === 'never' ? result += '[]' : result += '[' + index + ']';
				result += options.delimiter;
				// return [...final, ...splitArrayToString(value, result)];
				return final.concat( splitArrayToString(datum, result) );
			} else {
				options.shouldIndex === 'always' ? result += '[' + index + ']' : result += '[]';
				final.push([result, datum]);
				return final;
			}
		}, []);
	}

	function splitObjectToString(data, prevValue) {
		return Object.entries(data).reduce( (final, [key, value]) => {
			let isobject = isObject(value),
				isarray = isArray(value)
				result = prevValue || '';
			
			//update result to contain the new level
			result = result ? (result + options.delimiter + key) : key;

			if (isobject) {
				result += '{}';
				// return [...final, ...splitObjectToString(value, result)];
				return final.concat( splitObjectToString(value, result) );
			} else if (isarray) {
				// return [...final, ...splitArrayToString(value, result)];
				return final.concat( splitArrayToString(value, result) );
			} else {
				final.push([result, value]);
				return final;
			}
			return final;
		}, []);
	}
	
	/* SERIALEASY */
	function form2js(data) {
		// data should be an array or node list
		// validate and rework the data
		// - end format is array of objects with signature {structure: [], value: any, original: string}
		data = [].reduce.call( data, (final, datum) => {
			let extracted = {
				structure: null,
				value: null,
				original: null
			}

			// if element is an array
			if ( isArray(datum) ) {
				if (datum.length !== 2 || typeof datum[0] !== 'string') {
					console.log('Inappropriate format. The following will not be processed: ' + datum);
					return final;
				}

				extracted.otiginal = datum[0];
				extracted.structure = datum[0].split(options.delimiter);
				extracted.value = datum[1];
			}
			// else if it is an html element
			else if ( isElement(datum) ) {
				// if select and select is multiple
				if ( datum.tagName === 'SELECT' && datum.hasAttribute('multiple') ) {
					var vals = [],
						optionTags = select && select.options;
					for (var i=0, iLen=optionTags.length; i<iLen; i++) {
						if (options.collectAllValues === true) {
							var res = {};
							res[optionTags[i].value || optionTags[i].text] = optionTags[i].selected;
							vals.push(res);
						}	
						else if (optionTags[i].selected) {
							vals.push(optionTags[i].value || optionTags[i].text);
						}
					}

					vals.length && (extracted.vals = JSON.parse( JSON.stringify(vals) ) );
				}
				// if radio or checkbox
				else if (datum.type === 'radio' || datum.type === 'checkbox') {
					if (options.collectAllValues === true) {
						var res = {};
						res[datum.value] = datum.checked;
						extracted.value = res;
					}
					else if (datum.type === "radio" && datum.checked) {
						extracted.value = datum.value;
					} else if (datum.type === 'checkbox') {
						extracted.value = datum.checked;
					}
				} 
				// otherwise, any other input tag
				else {
					if (options.collectAllValues === true) {
						extracted.value = datum.value;
					} else {
						datum.value !== "" && (extracted.value = datum.value);
					}
				}

				// extract the structure
				datum.dataset[options.dataset] && 
					( extracted.original = datum.dataset[options.dataset] ) &&
					( extracted.structure = datum.dataset[options.dataset].split(options.delimiter) );
			}

			// structure should not be empty/null
			if (extracted.structure === null) {
				console.log('Could not identify the structure for this input. There seems to be no data attribute called "' + options.structure + '". The following will not be processed any further: ', datum);
				return final;
			}
			// these should be no emty/null values unless collectAllValues is true
			else if (options.collectAllValues !== true && extracted.value === null) {
				return final;
			}

			final.push(extracted);
			return final;
		}, []);

		if (data.length === 0) {
			console.log('None of the data is suitable for serializing. Please try with a different set.');
			return null;
		}

		// rework the values
		// - the function should edit the data in place
		typeof options.preprocess === 'function' && options.preprocess(data);

		// construct and return
		return construct(data);
	}
	
	function construct(data) {
		// data is an array or objects with signature {structure: [], value: any}
		// returns an object
		return data.reduce( (final, datum) => {
			// translate the requirements
			datum.translated = translate(datum.structure);
			// then reduces with translateToObject
			datum.combined = combine(datum);
			// then merges with deepMerge
			final = merge(final, datum.combined);
			return final;
		}, {});
	}

	function translate(structure) {
		return structure.map( (level, levelIndex) => {
			let key = null, keyValueType = null, modifier = null, index = null;

			// get key
			key = level.replace(keyRegEx, '');
			// get modifier
			modifier = level.match(modifierRegEx);
			modifier ? (modifier = modifier[0]) : '';
			// get index
			index = level.match(modifierRegEx);
			index && !isNaN(index[1]) && index[1] !== '' ? (index = +index[1]) : (index = null);

			// determine the keyValue based on the modifier
			if (modifier) {
				if ( modifier.startsWith('{') ) {
					keyValueType = 'object';
				}
				else if ( modifier.startsWith('[') ) {
					keyValueType = 'array';
				}
			}

			return {
				key: key,
				keyValueType: keyValueType,
				modifier: modifier,
				index: index
			}
		});
	}

	function combine(data) {
		let position = null,
			positionIsArray = false,
			positionStartIndex = null,
			dataLength = data.translated.length - 1;

		return data.translated.reduce( (final, level, levelIndex) => {
			// first iteration, or postion is an object
			if (!position) {
				// assign the key and value to the object, as well as the new position
				// position = final[level.key || level.index || 0] = level.keyValueType === 'array' ? [] : 
				// 								level.keyValueType === 'object' ? {} : data.value;
				if (level.key) {
					position = final[level.key] = level.keyValueType === 'array' ? [] : 
												level.keyValueType === 'object' ? {} : data.value;
				} else {
					position = final = [];
				}
			}
			// if not first iteration, and position is an object
			else if (positionIsArray === false) {
				// assign the key and value to the object, as well as the new position
				position = position[level.key] = level.keyValueType === 'array' ? [] : 
												level.keyValueType === 'object' ? {} : data.value;				
			}
			// otherwise, the position is an array
			else {
				// if the current level is an array
				if (!level.key && level.keyValueType === 'array') {
					position[positionStartIndex || 0] = [];
				}
				// otherwise, the level is an object, or final value
				else {
					// if there is a key, the level is an object
					if (level.key !== null) {
						// set as object
						position[positionStartIndex || 0] = {};
						// assign the key and value to the object
						if (level.keyValueType === 'array')
							position[positionStartIndex || 0][level.key] = [];
						else if (level.keyValueType === 'object')
							position[positionStartIndex || 0][level.key] = {};
						else
							position[positionStartIndex || 0][level.key ] = data.value;
					}
					// else final value
					else {
						position[positionStartIndex || 0] = data.value;
					}
				}

				// assign the new position
				position = level.key ? position[positionStartIndex || 0][level.key] : position[positionStartIndex || 0];
			}

			// if last level and it is an array, set the value within the array at the correct index
			if(levelIndex === dataLength && level.keyValueType === 'array') {
				level.index !== null ? 
					(position[level.index] = data.value ) :
					position.push(data.value);
			}

			// recalculate position attributes
			positionIsArray = (level.keyValueType === 'array');
			positionStartIndex = level.index;

			return final;
		}, {});
	}

	// inspired by https://davidwalsh.name/javascript-deep-merge
	function merge(target, source) {
		let isSourceArray = isArray(source),
			isTargetArray = isArray(target);
		
		// if array
		if (isSourceArray) {
			if (isTargetArray) {
				if (options.mergeArrays) {
					source.forEach(function(e, i) {
						if (typeof target[i] === 'undefined') {
							target[i] = JSON.parse( JSON.stringify( e ) );
						} else if ( isObject( e ) || isArray( e ) ) {
							target[i] = merge(target[i], e)
						} else {
							target.push( JSON.parse( JSON.stringify( e ) ) );
						}
					});
				} else {
					target = target.concat(source);
				}
			} else {
				target = JSON.parse( JSON.stringify(source) );
			}
		} 
		// else treat as object
		else {
			Object.keys(source).forEach(function (key) {
				if (!(isArray(source[key]) || isObject(source[key]) ) || !target[key]) {
					target[key] = JSON.parse( JSON.stringify(source[key]) );
				} else {
					target[key] = merge(target[key], source[key])
				}
			})
		}

		return target;
	}

	merge.all = function mergeAll(array) {
		if (!Array.isArray(array) || array.length < 2) {
			throw new Error('first argument should be an array with at least two elements');
		}
	
		// we are sure there are at least 2 values, so it is safe to have no initial value
		return array.reduce(function(prev, next) {
			return merge(prev, next);
		});
	}
	
	return {
		serialize: form2js,
		unserialize: js2strings,
		setOptions: setOptions,
	};
});