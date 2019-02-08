var serialeasy = (function() {
	// 1. allow false/empty values as well, line 127
	// 2. handle select element
	// NOTE: do not store objects in arrays without index, or they will merge, maybe add mergeArrays option?!
	var options = {
		dataset: 'structure',
		delimiter: '-',
		mergeArrays: true,
	};
	
	var value, position;
	
	function form2js(elementCollection) {
		return [].reduce.call(elementCollection, function(result, element) {

			if(!element.dataset[options.dataset]) return result;

			value = element.type === 'checkbox' ? element.checked : element.value;
			
			if ( !value ) return result; //this will ensure it returns null, if no values in the form
			
			result = result || {}; //this will ensure that if there is a value, the final result will be an object
			
			var structure;
				
			try {
				structure = element.dataset[options.dataset].split(options.delimiter);
			} catch (err) {
				console.log(`The dataset attribute you provided does not exist, or the delimiter is wrong.\n\nDataset should be "data-${options.dataset}"\n\nDelimiter should be "${options.delimiter}"\n\n`, err);
				return result;
			}
			
			//translate the structure into an array of objects {key, modifier, type, value, index, typeOfValues}
			structure = structure.map( translateToArray );
			
			//console.log('Structure In Array Form: ', structure);
			
			//merge the structure levels into a single object
			structure = structure.reduce( translateToObject, {} );
			
			//console.log('Structure In Object Form: ', structure);
			
			//reset the position to null for next element
			position = null;
			
			//merge structure with the final data obect, structure is now a possibly multi-level object
			result = merge_deep(result, structure);
			
			//return the final result
			return result;
		}, null );
	}
	
	function translateToArray(level) {
		var obj = {}, modifier;
		//assign the key, it is the part before the brackets
		obj.key = level.replace(/\[+(.*?)\]+|\{.*?\}/g, "");
		
		//check the type, the brackets and content within them
		modifier = level.match(/\[+(.*?)\]+|\{.*?\}/i);
		
		//if there is a type, determine what it is
		if ( modifier ) {
			modifier = modifier[0];
			obj.modifier = modifier;
			
			//assign the value based on type
			if ( modifier.startsWith('{') ) {
				obj.type = 'object';
				obj.value = {};
			}
			else if ( modifier.startsWith('[') ) {
				obj.type = 'array';
				obj.value = [];
				
				//check whether there is an index (index means array of objects)
				if ( obj.modifier.length > 2 ) {
					//check for index
					var num = modifier.match(/\d+/);
					if (num) {
						obj.index = parseInt(num[0]);
					}
					else obj.index = null;
					
					//check for the type of elements within the array
					var typeOfValues = obj.modifier.substr(1, obj.modifier.length - 2).match(/\[.*?\]|\{.*?\}/i);
					if (typeOfValues) {
						obj.typeOfValues = typeOfValues[0].startsWith('[') ? [] : {};
						
						obj.index ? obj.value[obj.index] = obj.typeOfValues : obj.value.push(obj.typeOfValues);
					}
					else obj.typeOfValues = null;
				} else {
					obj.index = null;
					obj.typeOfValues = null;
				}
			}
			else obj.value = value;
		}
		
		//if no value, is assigned based on type, this means it is a final level, so value should be the value of the input... so assign it as such
		if (!obj.value) obj.value = value;
		
		//return the broken-down structure
		return obj;		
	}

		
	function translateToObject(res, level) {
		//if it is the first iteration (position is not set)
		if (!position) {
			//it all starts with an object, so treat it as such and assign the key and value of the level
			res[level.key] = level.value;
			//if value is an array
			if ( level.type === 'array' ) {
				if ( level.index !== null && level.typeOfValues ) position = res[level.key][level.index];
				else if ( level.index !== null && !level.typeOfValues ) {
					res[level.key][level.index] = {};
					position = res[level.key][level.index];
				}
				else if ( !level.index !== null && level.typeOfValues ) position = res[level.key][0];
				else position = res[level.key];
			}
			//if not an array
			else {							
				position = res[level.key];
			}
		} 
		//if it is a subsequest interation (position is set)
		else {
			if (position instanceof Array) {
				//this would mean that the array is not of objects, so push the key or value accordingly
				if (level.key && typeof level.value === 'boolean') position.push(level.key);
				else position.push(level.value);
			} else if (position instanceof Object) {
				//assign key and value of the level
				position[level.key] = level.value;
				//if value is an array
				if ( level.type === 'array' ) {
					if ( level.index !== null && level.typeOfValues ) position = position[level.key][level.index];
					else if ( level.index !== null && !level.typeOfValues ) {
						position[level.key][level.index] = {};
						position = position[level.key][level.index];
					}
					else if ( !level.index !== null && level.typeOfValues ) position = position[level.key][0];
					else position = position[level.key];
				}
				//if not an array
				else {							
					position = position[level.key];
				}
			}
		}
		//return the possibly multi-level object
		return res;
	}
		
	function merge_deep(...objects) {
		const isObject = obj => obj && obj instanceof Object && !Array.isArray(obj);
		const isValidIndex = entry => entry && entry instanceof Object;

		return objects.reduce((prev, obj) => {
			Object.keys(obj).forEach(key => {
				//get the value of each key for both the end result and the current object
				const pVal = prev[key];
				const oVal = obj[key];
				//if key is an array
				if (Array.isArray(pVal) && Array.isArray(oVal)) {
					if (options.mergeArrays) {
						var oIndex = oVal.findIndex(isValidIndex);
						if ( oIndex >= 0 ) {
							if (  Array.isArray( pVal[oIndex] ) && Array.isArray( oVal[oIndex] ) ) {
								prev[key][oIndex] = pVal[oIndex].concat(...oVal);
							} else if ( isObject( pVal[oIndex] ) && isObject( oVal[oIndex] ) ) {
								prev[key][oIndex] = merge_deep(pVal[oIndex], oVal[oIndex]);
							} else {
								prev[key][oIndex] = oVal[oIndex];
							}
						} else {
							prev[key] = pVal.concat(...oVal);
						}
					}
					else {
						prev[key] = pVal.concat(...oVal);
					}
				}
				//if key is an object
				else if (isObject(pVal) && isObject(oVal)) {
					prev[key] = merge_deep(pVal, oVal);
				}
				//else assign the new value to the end result
				else {
					prev[key] = oVal;
				}
			});

			return prev;
		}, {} );
	}

	function setOptions(opts) {
		Object.assign(options, opts);
		console.log(options);
		return this;
	}
	
	return {
		serialize: form2js,
		setOptions: setOptions,
	};
});


