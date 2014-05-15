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
		var $ = require('jquery');

        /**
         * SnapsSpreadsheetOptions takes user options defined in data-options
         * attribute on the element.  These options are made accessible
         * to other modules.
         *
         * @class SnapsSpreadsheetOptions
         * @param {jQuery} $element A reference to the containing DOM element
         * @constructor
         */
        var SnapsSpreadsheetOptions = function (element) {

            /**
             * A reference to the containing DOM element
             *
             * @default null
             * @property $element
             * @type {jQuery}
             */
            this.$element = element;

            this.init();

        };

        /**
         * Initializes the the setOptions method.
         * 
         * @method init
         * @returns {SnapsSpreadsheetOptions}
         *
         */
        SnapsSpreadsheetOptions.prototype.init = function () {
            this.setOptions();

            return this;
        };

        /**
         * This sets the options via data-options in the html markup. If
         * the options aren't set it goes to the defaults.
         *
         * Default URL parameters are also set via the defaultUrlParams 
         * property.
         *
         * These options are necessary for users to adjust the Backbone Views.
         *
         * @method setOptions
         * @returns {SnapsSpreadsheetOptions}
         *
         */
        SnapsSpreadsheetOptions.prototype.setOptions = function () {
            var self = this;

            // User inputs added to the data-options attribute of this.element
            var userOptions = this.$element.data().options;

            // Default options.
            var defaultOptions = {
                // dimensionsTemplate = #ID of script template for selector.
                'dimensionsTemplate': null,
                // resultsTemplate = #ID of script template for displaying results.
                'resultsTemplate': null,
                'resultsPerPage' : '20',
                'environment' : null,
                'previewextNval' : null,
                'solutionsNval' : null,
                // zeroResultsTemplate = #ID of script template for displaying zero results found.
                'zeroResultsTemplate': 'zeroResults',
                'label_searchedOn': 'You searched on:',
                'label_toggleBtn_ShowText': 'Show Search',
                'label_toggleBtn_HideText': 'Hide Search',
                'label_descriptionText': null,
                'label_heading': null,
                'label_select': 'Select',
                'label_deselect': 'De-select',
                'label_or': 'or',
                'label_postalCode': 'Postal Code',
                // Array of string values.  If there is more than 1 value in 
                // the array then a dropdown list will render on the page.
                'postalCodeSearchDistance': ['100'],
                'label_distance': 'Select distance',
                'label_viewResults': 'View Results',
                'label_reset': 'Reset',
                'label_showNext':'Show Next',
                'label_of': 'of',
                'label_matches': 'Matches',
                'label_sortBy': 'Sort by:',
                'label_selectSort': '-- Select Sort --',
                'label_ascendingAbbreviation' : 'Asc.',
                'label_descendingAbbreviation' : 'Desc.',
                'label_primaryButtonText' : 'Primary Button',
                'label_secondaryButtonText' : 'Secondary Button',
                'label_tertiaryButtonText' : 'Tertiary Button',
                'ss.displayNames' : '',
                'ss.displayLinks' : '',
                // Default is empty string. A .split() is used on this value so 
                // an empty string is provided to prevent throwing a JS error if 
                // combinedColumns is empty.
                'combinedColumns': '',
                'usage': null

            };


            /**
             * Merge userOptions and any defaultOptions.  
             * userSettings should be accessable to the Backbone View via
             * SnapsSpreadsheetOptions.userSettings.[property]
             */
            this.userSettings = $.extend({}, defaultOptions, userOptions);

            // Cherry pick any user defined options that are also needed as default url parameters
            this.defaultUrlParams = {
                // gblid = Global labelset ID. This is a constant.  
                'gblid': '1273672875186',
                // rt = Request Type.  Tells SNAPS backend which type of request is made.
                // sel = selector.
                'rt': 'sel',
                // usage = 'ss' for Spreadsheet or 'ps' for Product Search
                'usage': this.userSettings.usage,
                // plmid = Portlet ID
                'plmid': function () {
                    return self.$element.closest('.component-control').find('span').eq(0).attr('id');
                },
                // pid = Page ID from the meta tag.
                'pid': function () {
                    var meta = document.getElementsByName('DCSext.ewcd_url');
                    return meta[0].content.split('|')[0].trim();
                },
                // loc = the locale of the current page. Ex: 'en_US'
                'loc': function () {
                    var getRegion = document.getElementsByName('DCSext.locale')[0].getAttribute('content');
                    return getRegion;
                },
                // MDR = Mobile Redirect.  Mobile devices will not be redirected to a m.dot url.
                'MDR': 'true',
 
                'ss.distance': '10||20||30||50||75||100',
                // ss.proximityLocator = Enables searching based on postal code.
                'ss.proximityLocator': 'true',
                // ss.milesConverter = kilometers per mile
                'ss.milesConverter': '1.609344',
                // ss.selectoruniqueid = Used in case of multiple selectors on a page.
                // A unique value will be provided for each selector.
                'ss.selectoruniqueid': function () {
                    var milleseconds = new Date().getTime();
                    return milleseconds;
                },
                'ss.proximityUrl': 'http://solutions.3m.com/CountryIP/',
                // ss.displayNames = String passed to webservice to determine which columns in the
                // data to return. Can also be used to re-name the data in the 
                // columns node.
                // || = delimiter for multiple changes in the displayed names.
                // Example:  column1DisplayedName$$$column1SpreadsheetColumnName||column2DisplayedName$$$column2SpreadsheetColumnName||column3DisplayedName$$$column3SpreadsheetColumnName
                'ss.displayNames' : this.userSettings['ss.displayNames'],
                // ss.displayLinks = Modifies spreadsheet column node in data.  
                // Adds 'linkedTo' property to each item.
                // || = delimiter for multiple linked columns.
                // Example:  column1SpreadsheetColumnName$$$column2SpreadsheetColumnName||column3SpreadsheetColumnName$$$column4SpreadsheetColumnName
                'ss.displayLinks' : this.userSettings['ss.displayLinks'],
                // viewResultsThresHold = Number of results that can be returned.
                'viewResultsThresHold': '9000',
                // includeRecords = Include the records node in the JSON.
                'includeRecords': 'false',
                'No' : '0',
                // resultsPerPage = Number of records to return per page
                'resultsPerPage': this.userSettings.resultsPerPage,
                // baseN = base n-value.
                'baseN': function () {
                    if (self.userSettings.environment === 'previewext') {
                        return self.userSettings.previewextNval;
                    } else {
                        return self.userSettings.solutionsNval;
                    }
                },
                // N = Base N value at the top level.  Will be modified as selections are made.
                'N': function () {
                    if (self.userSettings.environment === 'previewext') {
                        return self.userSettings.previewextNval;
                    } else {
                        return self.userSettings.solutionsNval;
                    }
                },
                '_': function () {
                    // Generate new millisecond value for this parameter
                    var date = new Date().getTime();
                    return date;
                }
            };

            return this;

        };

        return new SnapsSpreadsheetOptions( $('.js-MiniSnaps') );

    });

}(MMMRequire));