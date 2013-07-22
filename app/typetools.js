//@todo: Make vanilla-js (not a require module) and move to vendor folder
define(["plugins/jquery.timeago"], function() {

	var typetools = {

	    numberWithCommas: function(x) {
	      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	    },

		capitalize: function(string, seperator) {
		  var idIndex;

		  if (!string) return '';

		  if (seperator === undefined) {
		    seperator = "_";
		  }

		  directusIndex = string.indexOf("directus_");

		  if (directusIndex === 0) {
		    string = string.substring(9);
		  }

		  idIndex = string.lastIndexOf("_id");

		  if (string.length > 2 && string.length - idIndex === 3) {
		    string = string.substring(0, idIndex);
		  }

		  var output = _.map(string.split(seperator), function(word) { return word.charAt(0).toUpperCase() + word.slice(1); }).join(' ');

		  // var output2 = output;
		  // output.toLowerCase();
		  // output = (output + '').replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function ($1) {
		  //   return $1.toUpperCase();
		  // });
		  // output.trim();
		  // output = output.replace(new RegExp("!\s+!", "g")," ");

		  // Replace all custom capitalization here
		  _.each(typetools.caseSpecial, function(correctCase) {
		    output = output.replace(new RegExp("\\b"+correctCase+"\\b", "gi"), correctCase);
		  });

		  // Make all prepositions and conjunctions lowercase, except for the first word
		  _.each(typetools.caseLower, function(correctCase) {
		    output = output.replace(new RegExp(" "+correctCase+"\\b", "gi"), " "+correctCase);
		  });

		  return output;
		},

		caseSpecial: [
		  'CMS',
		  'FAQ',
		  'iPhone',
		  'iPad',
		  'iPod',
		  'iOS',
		  'iMac',
		  'PDF',
		  'PDFs',
		  'URL',
		  'IP',
		  'UI',
		  'FTP',
		  'DB',
		  'WYSIWYG',
		  'CV',
		  'ID',
		  'pH',
		  'PHP',
		  'HTML',
		  'JS',
		  'CSS',
		  'SKU',
		  'DateTime',
		  'RNGR',
		  'CC',
		  'CCV',
		  'SoulCycle'
		],

		// Conjunctions and prepositions should be lowercase
		caseLower: [
		  'a',
		  'an',
		  'the',
		  'and',
		  'of',
		  'but',
		  'or',
		  'for',
		  'nor',
		  'with',
		  'on',
		  'at',
		  'to',
		  'from',
		  'by'
		],

		actionMap: {
		  'ADD': 'added',
		  'DELETE': 'deleted',
		  'UPDATE': 'updated'
		},

		prepositionMap: {
		  'ADD': 'to',
		  'DELETE': 'from',
		  'UPDATE': 'within'
		},

		bytesToSize: function(bytes, precision) {
	      var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	      var posttxt = 0;
	      bytes = parseInt(bytes,10);
	      if (bytes === 0) return 'n/a';
	      while( bytes >= 1024 ) {
	          posttxt++;
	          bytes = bytes / 1024;
	      }
	      return bytes.toFixed(precision) + " " + sizes[posttxt];
    	},

	    contextualDate: function(value) {
	      if (value === undefined) return '';
	      //@todo: convert value to correct timezone
	      return jQuery.timeago(value);
	    },

	    dateYYYYMMDD: function(date) {
      		return date.toISOString().slice(0,10);
    	}

	};

	//console.log(typetools.contextualDate('2011-10-02'));
	//console.log(typetools.numberWithCommas(500000000000000));
	//console.log(typetools.bytesToSize(10000));
	//console.log(typetools.numberWithCommas(500000000000000));
	//console.log(typetools.numberWithCommas(500000000000000));


	return typetools;
});