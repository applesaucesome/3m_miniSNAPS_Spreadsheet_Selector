/* ---------------------------------------------------------------------
Original Author: Matthew Dordal (pin: a2xnyzz) and Kyle Leichtle (pin: a32s6zz)
Revision Date: May 6, 2014
----------------------------------------------------------------------*/

(function (context) {
    'use strict';
    var require = context.require;
    var requirejs = context.requirejs;
    var define = context.define;

    define(function (require) {
        var $ = require('jquery'),
            _ = require('underscore'),
            BackBone = require('backbone'),
            SnapsSpreadsheetOptions = require('kungfu/Mini-SNAPS/SnapsSpreadsheetOptions');

        /**
        * Set default values for our model - these just set a baseline of data to be passed to our collection even if there is no data being populated
        */
        var SpreadsheetModel = Backbone.Model.extend({

            defaults: {
                'columns': undefined,
                'dimensions': undefined,
                'records': undefined,
                'selectoruid': undefined,
                'totalResults': undefined,
                'whiteListedDisplayNames': undefined,
                'resultsPerPage': undefined,
                'postalCodeSearchDistance' : undefined,
                'currSelectedDimensions' : undefined
            }

        });

        
        var displayLinksArray = [], // Used for linking columns.
            combinedColumns; // Used to store a parsed array of objects that multiple functions will be using

        /**
        * Configure our collection by attaching a model to it, passing an ajax url, and then parsing the data before it's returned in the 'success'
        */


        var SpreadsheetCollection = Backbone.Collection.extend({
            model: SpreadsheetModel,

            // URL for ajax call
            url: 'http://' + SnapsSpreadsheetOptions.userSettings.environment + '.3m.com/wps/PA_Snaps/AjaxServlet',

            /**
            * Create an array to store columns, based on their column
            * name in 'ss.displayNames', that should be displayed
            *
            * returns: 'displayNamesArray'
            */

            setupDisplayNamesArray: function (data) {
                var displayNames = SnapsSpreadsheetOptions.userSettings['ss.displayNames'],
                    displayNamesSplit = displayNames.split('||'),
                    displayNamesArray = [];

                    // Create an array out of our display names
                _.each(displayNamesSplit, function(colName, i){
                    var splitIndex = colName.indexOf('$$$') + 3;
                    var formattedColName = colName.substr(splitIndex);
                    displayNamesArray.push(formattedColName);
                });

                return displayNamesArray;
            },

            /**
            * Assign each column an 'orderNum' number, based on 
            * the order that the user typed them in, within 'ss.displayNames'.
            *
            * returns: SpreadsheetCollection (itself)
            */
            sortColumns: function (data) {
                var columns = data.columns,
                    columnsLength = columns.length,
                    array = this.setupDisplayNamesArray(data);

                // loop through the columns objects. This will add an 'orderNum'
                // property to the columns object.  'orderNum' will be used for sorting
                for (var i = 0; i < columnsLength; i++) {

                    var currCol = columns[i],
                        currColName = currCol.name;

                    // If the current column.name is in 'array', add a new
                    // property to the column object equal to the index position of 
                    // the name in array.
                    if (array.indexOf(currCol.name) > -1){
                        var orderNumber = array.indexOf(currCol.name);
                        currCol.orderNum = orderNumber;
                    }
                }

                // sort the columns based on there 'orderNum' property.
                columns.sort( function (a, b) {
                    if ( (typeof a.orderNum === 'undefined' && typeof b.orderNum !== 'undefined') || a.orderNum < b.orderNum ) {
                        return -1;
                    }
                    if ( (typeof b.orderNum === 'undefined' && typeof a.orderNum !== 'undefined') || a.orderNum > b.orderNum ) {
                        return 1;
                    }
                    return 0;
                });

                return this;
            },

            /**
            * Assign each column an 'orderNum' number, based on 
            * the order that the user typed them in, within 'ss.displayNames'.
            *
            * returns: SpreadsheetCollection (itself)
            */
            setupCombinedColumnsArray: function (data) {
                var combinedColumnsNames = SnapsSpreadsheetOptions.userSettings.combinedColumns, // Value of 'combinedColumns' found in userSettings
                    combinedColumnsSplit = combinedColumnsNames.split('||'), // Create array of combinedColumns, based on values seperated by the || character
                    combinedColumnsArray = [];

                // Create an array out of our combinedColumns
                _.each(combinedColumnsSplit, function(colCombo, i, list){
                    var delimiterArray = [], // Array to store user specified column delimiters for combined columns.
                        colComboSplit = colCombo.split('+'),
                        cleanColCombo = [], // Array of combined-column values with the delimiter removed.
                        targetColumn = colComboSplit[0], // Select the first array item as that will be the target column where the rest of the columns will be combined into
                        delimiter = ' '; // Stores column-value delimiter, specified by the user.  Set a default of one space for this

                    // Loop through the split-combinedColumns.  Add user specified 
                    // column-value delimiter to dilimiterArray.
                    _.each(colComboSplit, function (element, index) {

                        // If() for targetColumn
                        if (targetColumn.indexOf('[') > -1) {
                            var startBracketPosition = colComboSplit[0].indexOf('[');

                            // Don't target itself as it can cause issues within each-loops, sometimes it can take the previous loop's value into the next loop
                            targetColumn = colComboSplit[0].substring(0, startBracketPosition);

                        }

                        // If-else() for 'element'
                        if ( element.indexOf('[') > -1 ) {
                            // If user specifies a column-value delimiter push it into the delimiterArray.
                            var startingBracketPosition = element.indexOf('['),
                            startingBracketPositionPlusOne = element.indexOf('[') + 1,
                                endingBrackingPosition = element.indexOf(']');


                            // Cut off any delimiters, before pushing it to the 'cleanColCombo' array
                            var columnName = element.substring(0, startingBracketPosition);
                            cleanColCombo.push(columnName);

                            // Create a variable that contains the user definied delimiter and see if it's valid
                            var delimiterTest = element.substring(startingBracketPositionPlusOne, endingBrackingPosition);
                            // The user defined delimiter must be a ',' or ', ' or '<br>'
                            if (delimiterTest === ',' || delimiterTest === ', ' || delimiterTest === '<br>' || delimiterTest === '<BR>') {

                                delimiter = element.substring(startingBracketPositionPlusOne, endingBrackingPosition);

                            }
                            // Push the delimiter to the 'delimiterArray' array which will be assigned to the 'delimiter' property in 'combinedColumnsArray'
                            delimiterArray.push(delimiter);
                        } else {

                            // We don't need to cut off any delimiters if the logic made it into this else{} statement, before pushing it to the 'cleanColCombo' array
                            cleanColCombo.push(element);
                            delimiter = ' '; // if user specified column delimiter is not used then default to empty space.

                            // Push the delimiter to the 'delimiterArray' array which will be assigned to the 'delimiter' property in 'combinedColumnsArray'
                            delimiterArray.push(delimiter);
                        }

                    });
                    
                    // Push the object into 'combinedColumnsArray', which will be used to define the 'combinedColumns' variable
                    combinedColumnsArray.push(
                        {
                            targetColName: targetColumn,
                            columns: cleanColCombo,
                            delimiter: delimiterArray
                        }
                    );
                });

                return combinedColumnsArray;
            },

            /**
            * - Parses user-defined delimiters on 'combinedColumns'.
            * - Sorts Columns
            * - Merges mecords together
            * - Sorts records
            *
            * returns: SpreadsheetCollection (itself)
            */
            combinedRecords: function (data) {

                var records = data.records,
                    recordsLength = records.length,
                    displayNames = this.setupDisplayNamesArray(data),
                    displayLinks = SnapsSpreadsheetOptions.userSettings['ss.displayLinks'],
                    splitDisplayLinks = displayLinks.split('||');
                
                // Create an array of objects out of our ss.displayLinks.
                // Formatting Example: targetColumn1$$$linkedToColumn1||targetColumn2$$$linkedToColumn2                
                _.each(splitDisplayLinks, function(colName, i){
                    var splitIndex = colName.indexOf('$$$') + 3,
                        nameBeforeDollars = colName.substring(0, colName.indexOf('$$$')),
                        nameAfterDollars = colName.substr(splitIndex),
                        obj = {
                            name: nameBeforeDollars,
                            linkedTo: nameAfterDollars,
                            value: null,
                            text: null
                        };

                    displayLinksArray.push(obj);
                });


                // Sort the columns objects in the data based on their 'orderNum' property, 
                // in ascending order if the 'columns' node exists in the data.
                if (data.columns) {
                    this.sortColumns(data);
                }

                // Loop through records
                for (var i = 0; i < recordsLength; i++) {
                    var currRecord = records[i].attributes,
                        mergedRecords;

                    // Begin underscore methods to group up multi-dimension records
                    mergedRecords = _.map(_.groupBy(currRecord, 'name'), function(a) {
                        
                        // Remove any forward/back slashes, white spaces, and &'s from the value, so that we can use 'value.value' for adding a class name
                        var iteratorRecordName = a[0].name.replace(/\s+|\/|\\|\&/g, '');

                        // Filter out 'n/a' from the combined columns value
                        var recValue = _.pluck(a, 'value');
                        if (recValue[0] === 'n/a'){
                            recValue = '';
                        } else {
                        // If it's not 'n/a', join() the array as usual into a single string
                            recValue = recValue.join(', ');
                        }

                        return {
                            'name': a[0].name,
                            'value':  '<span class="columnName-'+ iteratorRecordName +'">'+ recValue + '</span>',
                            'text': _.pluck(a, 'value').join(', ')
                        };
                    });

                    // Loop through mergedRecords.  Several blocks of code are utilizing
                    // this loop, so be mindful of the comments within.
                    _.each(mergedRecords, function(value, key, list) {

                        // If 'displayNames' array contains a string that is the same
                        // as 'value.name' then add an 'orderNum' property to the record
                        // equal to the index position in the 'displayNames' array.
                        if (displayNames.indexOf(value.name) > -1) {
                            var orderNumber = displayNames.indexOf(value.name);
                            value.orderNum = orderNumber;
                        }

                        // We're looping through the 'displayLinksArray' array to check if the
                        // the current record column matches the 'linkedTo' column.
                        // If it does, we want to update the 'value' property in 'displayLinksArray'
                        // and combine it with the record column that matched the 'linkedTo' column
                        _.each(displayLinksArray, function (element, index) {
                            // If the 'linkedTo' column name matches with the current record name, 
                            // update the 'value' in 'displayLinksArray'
                            if (element.linkedTo === value.name) {

                                element.text = value.text;
                            }
                            // Now check to see if the current record name matches with the 'element.name' 
                            // property in 'displayLinksArray' and check to make sure it's a valid
                            // email and that it's not 'n/a' or blank.  If it's valid, create an
                            // appropriate link for it.
                            if (element.name === value.name && element.text !== 'n/a') {

                                // The variable 'isEmailRegex' is a regex used for basic email address detection
                                var isEmailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                                // Check if the value is an email address. If it is use 'mailto:'
                                if(isEmailRegex.test(element.text)) {
                                    value.value = '<a class="sel-resultsLink sel-emailLink" href="mailto:'+ element.text +'">' + value.text + '</a>';
                                // If the value is 'MMM-phone, automatically create a 'tel:' link for it
                                } else if(value.name === 'MMM-phone') {
                                    value.value = '<a class="sel-resultsLink sel-phoneLink" href="tel:'+ element.text +'">' + value.text + '</a>';
                                // If the value is 'MMM-primary-button' or 'MMM-secondary-button' or 'MMM-tertiary-button', create a button using the corporate styling
                                } else if(value.name === 'MMM-primary-button') {
                                    value.value = '<a class="sel-resultsLink MMM--btn MMM--btn_primary" href="'+ element.text +'">' + SnapsSpreadsheetOptions.userSettings.label_primaryButtonText + '</a>';
                                } else if(value.name === 'MMM-secondary-button') {
                                    value.value = '<a class="sel-resultsLink MMM--btn MMM--btn_secondary" href="'+ element.text +'">' + SnapsSpreadsheetOptions.userSettings.label_secondaryButtonText + '</a>';
                                } else if(value.name === 'MMM-tertiary-button') {
                                    value.value = '<a class="sel-resultsLink MMM--btn MMM--btn_tertiary" href="'+ element.text +'">' + SnapsSpreadsheetOptions.userSettings.label_tertiaryButtonText + '</a>';
                                // If it doesn't meet any of the other criterias, it must be a website url, so create a normal link
                                } else {
                                    value.value = '<a class="sel-resultsLink sel-webLink" target="_blank" href="'+ element.text +'">' + value.text + '</a>';
                                }
                            }
                        });
                    });


                    // Sort the mergedRecords based on the 'orderNum' property, in ascending order
                    mergedRecords.sort( function (a, b) {
                        if ( (typeof b.orderNum === 'undefined' && typeof a.orderNum !== 'undefined') || a.orderNum < b.orderNum ) {
                            return -1;
                        }
                        if ( (typeof a.orderNum === 'undefined' && typeof b.orderNum !== 'undefined') || a.orderNum > b.orderNum ) {
                            return 1;
                        }

                        return 0;
                    });

                    // Loop through 'mergedRecords' and use 'combinedColumns' as reference to know which columns to hide, based on which columns were merged into the target column
                    this.parseAndCombineColumnRecords(mergedRecords);

                    // Now apply 'mergedRecords' to the data's 'records.attributes' property
                    records[i].attributes = mergedRecords;
                }

                return this;
            },

            /**
            * Parses 'combinedColumns' user input, then loops through
            * 'combinedColumns' and parses that information, then 
            * edits 'mergedRecords' with that newly parsed information.
            *
            * After that it groups data in 'mergedRecords' based on the 
            * new information we just applied to it.
            *
            * After that it hides any columns that have been merged 
            * into another one. This is only hiding table CELLS, not HEADERS.
            * The function that hides the HEADERS is below: flagTableHeadersToHide()
            *
            * returns: SpreadsheetCollection (itself)
            */
            parseAndCombineColumnRecords : function(mergedRecords) {

                // We have to loop several times through 'mergedRecords' because the loop after is dependent on new data that is added from the previous one

                // The first loop is assigning the 'target' property to let us know what column we're going to be combining data into.  We also have to assign a 'combineColOrderNum' property to allow the user to control the order in which data is added to the target column
                _.each(mergedRecords, function(element, index, list) {

                    // Loop through the combinedColumns
                    _.each(combinedColumns, function(ele, ind) {

                        _.each(ele.columns, function(colValue, i){

                            // If combinedColumns.columns contains the 
                            // mergedRecord.name value then add the target
                            // properted to the mergedRecords object.
                            if (colValue === element.name) {
                                element.target = ele.targetColName;
                                element.combineColOrderNum = i;
                                element.delimiter = ele.delimiter[i];
                            }
                        });

                    });
                });

                // Group all records together that have a 'target' property
                var group = _.groupBy(mergedRecords, 'target');
                // Now create an array and sort them in ascending order using the number in their 'combineColOrderNum' property
                var mapped = _.map(group, function(value, key) {

                    value.sort( function(a, b) {

                        if ( (typeof a.combineColOrderNum === 'undefined' && typeof b.combineColOrderNum !== 'undefined') || a.combineColOrderNum < b.combineColOrderNum ) {
                            return -1;
                        }
                        if ( (typeof b.combineColOrderNum === 'undefined' && typeof a.combineColOrderNum !== 'undefined') || a.combineColOrderNum > b.combineColOrderNum ) {
                            return 1;
                        }
                        return 0;
                    });

                    // Combine the values together to form the value that will eventually replace the value in the target column
                    var groupByTarget = _.pluck(value, 'target');

                    // Loop through 'value' array, to combine each value's delimiter with each value in the 'groupedValue' array.  We can do this because the number of items in each array will always be the same since both are derived the the 'value' array.
                    _.each(value, function(element, index) {
                        if (element.delimiter) {
                            element.value = element.value + element.delimiter;
                        }
                    });

                    // Only return objects if the 'groupByTarget' array doesn't contain any 'undefined' items
                    if (groupByTarget.indexOf(undefined) < 0) {
                        return {
                            name: value[0].target,
                            value: _.pluck(value, 'value').join('')
                        };
                    }

                });

                // The last loop uses the 'mapped' variable to finally replace the target column's value with the newly combined value from the other columns that the user chose to combine together
                _.each(mergedRecords, function(element, index) {


                    // Here's where we're actually updating the record values
                    _.each(mapped, function(value, key) {

                        if (value!==undefined && element.name === value.name) {
                            element.value = value.value;
                        }
                    });

                    // Flag the table cells that should not be rendered.  We hide these because we don't want to show columns after we've already combined them into another column
                    _.each(combinedColumns, function (ele, i) {

                        if (ele.columns.indexOf(element.name) > -1 && element.name !== ele.targetColName) {
                            element.hideThisColumn = true;
                        }
                    });

                });

                return this;

            },

            /**
            * We've flagged the table CELLS that need to be hidden,
            * but we also need to hide the HEADERS.
            *
            * Flag 'data.columns' with a property called 'hideThisColumn'.
            * The underscore template will look for this property and
            * hide the associated HEADER if it finds it
            *
            * returns: SpreadsheetCollection (itself)
            */
            flagTableHeadersToHide: function (data) {

                // We are targeting the 'columns' node in the data but using 'combinedColumns' as a reference to match up each 'name' to find out which to flag 
                var columns = data.columns;

                // Flag the table headers that should not be rendered
                _.each(columns, function(element, index) {
                    _.each(combinedColumns, function (ele, i) {
                        if (ele.columns.indexOf(element.name) > -1 && element.name !== ele.targetColName) {
                            element.hideThisColumn = true;
                        }
                    });
                });

                return this;

            },

            /**
            * If/else() check
            *
            * If the 'response' doesn't contain any records, apply the
            * 'postalCodeSearchDistance' property and then pass it on.
            *
            * Else, the response must have records and so we initiate all
            * methods needed to parse/combined/sort them.
            *
            * returns: response (ajax data)
            */
            parse: function(response) {

                if (response.records === undefined) {
                    /**
                     * If we didn't grab any records, pass on the data to be populated into this collection
                     */

                    // Set the results dropdown so we can populate our Results Per Page dropdown
                    response.postalCodeSearchDistance = SnapsSpreadsheetOptions.userSettings.postalCodeSearchDistance;

                    return response;
                } else {

                    // Populate the 'combinedColumns' variable so that the rest of the functions can use it freely
                    combinedColumns = this.setupCombinedColumnsArray(response);

                    this.flagTableHeadersToHide(response);

                    this.combinedRecords(response);

                    // Apply the displayNames array to the response object.
                    response.whiteListedDisplayNames = this.setupDisplayNamesArray(response);

                    // Apply 'postalCodeSearchDistance' to the response
                    response.postalCodeSearchDistance = SnapsSpreadsheetOptions.userSettings.postalCodeSearchDistance;

                    return response;
                    
                }
            }

        });
        
        return SpreadsheetCollection;
    });

}(MMMRequire));