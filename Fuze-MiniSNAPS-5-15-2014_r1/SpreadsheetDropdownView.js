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
            SnapsSpreadsheetOptions = require('kungfu/Mini-SNAPS/SnapsSpreadsheetOptions'),
            SpreadsheetModelAndCollection = require('kungfu/Mini-SNAPS/SpreadsheetModelAndCollection');

        // This gets defined in our Render() method.  It's used to 
        // store the last known nVal, so we can use it for our 
        // "View Results" button.  Used in our "viewResults" method.
        var currentNval,
            baseNval = SnapsSpreadsheetOptions.defaultUrlParams.baseN,
            currentResultsPerPage = SnapsSpreadsheetOptions.userSettings.resultsPerPage,
            currentResultsPerPageIndex,
            pageLoadMoreNumber = 0, // Keep track of total results returned from the data. Used in the loadMoreResults() method
            resultsPerPage = parseInt(SnapsSpreadsheetOptions.userSettings.resultsPerPage, 10),
            numOfResults,
            disableUI = false,
            toggleButtonIsHidden = true,
            showText = SnapsSpreadsheetOptions.userSettings.label_toggleBtn_ShowText,
            hideText = SnapsSpreadsheetOptions.userSettings.label_toggleBtn_HideText,
            currSelectedDimensions,
            toggleButtonCurrText,
            loaderGif = '/3m_theme_assets/themes/3MTheme/assets/images/compressed/lazy-preloader-clear.gif';

        /*
         * View for the rSEL-02-Dropdown Component.
         * Mini-SNAPS Dropdown
         */
        var SpreadsheetDropdownView = Backbone.View.extend({
            el: '.js-MiniSnaps',

            /**
             * Fires on initial load.  Sets up a new Model and Collection.
             *
             * Method: initialize
             */
            initialize: function () {
                this.collection = new SpreadsheetModelAndCollection();

                return this;
            },

            /**
             * Update the Backbone Model with the data
             * from the ajax fetch method.
             *
             * For more information see here:  http://backbonejs.org/#View-render
             *
             * Method: render
             */
            render: function (newUrlParams, renderTemplates) {
                var self = this;

                // Merge our default params and override/add any new ones
                var urlParams = $.extend({}, SnapsSpreadsheetOptions.defaultUrlParams, newUrlParams);

                // Store the last used nVal, so that we can reference it when we click the "View Results" button
                currentNval = urlParams.N;

                // Store the currently selected dimensions so that we can update the "You searched on: " text
                currSelectedDimensions = urlParams.currSelectedDimensions;

                // .fetch() is Backbone's method for ajax.
                // For more information see: http://backbonejs.org/#Collection-fetch
                this.collection.fetch({
                    dataType: 'jsonp',
                    jsonp:'jsonp',
                    jsonpCallback: 'dropDownSelectorInit',
                    processData: true,
                    data: urlParams,
                    beforeSend: function(){
                        // Disable UI before ajax initiates
                        self.toggleDisableUI();
                    },
                    success: function (data) {
                        // Enable UI once ajax is successful
                        self.toggleDisableUI();

                        var toJson = self.collection.toJSON()[0];

                        // Apply the 'currSelectedDimensions' node so that we can use it in our underscore template to fill in the "You searched on: " text block
                        toJson.currSelectedDimensions = currSelectedDimensions;
                        
                        // Set a new node to pass the current Results Per Page, to retain the last option the user selected
                        toJson.currentRppIndex = currentResultsPerPageIndex;

                        // Populate the array's 'templateData' property with the newly updated collection
                        // Without a Data Source the template will not have any data to render.
                        var renderTemplatesLength = renderTemplates.length;
                        for (var r = 0; r < renderTemplatesLength; r++) {
                            renderTemplates[r].templateData = toJson;
                        }

                        // Array passed to .createTemplate() method and stored as 
                        // variable to be used later.
                        var templatesToRender = self.createTemplate(renderTemplates);

                        if (toJson.totalResults === '0') {
                            self.$('.js-snapsSel-multiColResults').hide();
                            self.$('.js-snapsSel-zeroResults').show();
              
                        } else {
                            // Render views that are in the array
                            var templatesToRenderLength = templatesToRender.length;
                            for (var i = 0; i < templatesToRenderLength; i++) {
                                // 'templatesToRender' was populated from the .createTemplate() method.
                                templatesToRender[i].render();
                            }

                            self.$('.js-snapsSel-toggleButton').text(toggleButtonCurrText).show();

                            self.$('.js-snapsSel-zeroResults').hide();
                            self.$('.js-snapsSel-multiColResults').show();

                        }

                        // Test this boolean variable because we don't want to show 
                        // the toggle button until the user first makes a search.
                        // We hide the toggleButton in the render so that it does not
                        // appear with empty text.
                        if (toggleButtonIsHidden === true){
                            self.$('.js-snapsSel-toggleButton').hide();
                        } else {
                            self.$('.js-snapsSel-toggleButton').show();
                        }



                        // When toJson.totalResults is less than or equal to the user defined
                        // 'resultsPerPage' hide the pagination's 'load more' button
                        if ( parseInt(toJson.totalResults, 10) <= resultsPerPage ) {
                            self.$('.js-snapsSel-loadMore').remove();
                        }

                    },
                    error: function (jqXHR, textStatus, errorThrown) {

                        /*
                         * Error in the ajax call.
                         * create a <p> element to store an error message. Add a 
                         * class to the <p> element.  Add text to the <p> element.
                         * Append the new <p> element to the container (self.el)
                         */
                        var errorElement = document.createElement('p');
                        errorElement.className = 'MMM--miniSnaps_errorText';

                        // Browsers greater than IE8 use textContent
                        // errorElement.textContent = 'Sorry... This content is currently unavailable';
                        // Browsers IE8 and lower use innerText
                        // errorElement.innerText = 'Sorry... This content is currently unavailable';

                        errorElement.innerHTML = 'Sorry... This content is currently unavailable';

                        self.el.appendChild(errorElement);
                    }
                });

                return this;
            },

            /*
             **
             * Utility Method for passing information to an Underscore Template
             *
             * The goal is to parse a template for each object in our 'templayArray'
             * and combine them into one master HTML block
             *
             * Method createTemplate
             * Returns {createTemplate}
             *
             */
            createTemplate: function (templateArray) {
                var self = this;
                var templateMiniSNAPS = [],
                    templateLength = templateArray.length;

                var NewView = Backbone.View.extend({
                    tagName: 'div',
                    initialize: function(options){

                        this.options = options || {};

                    },
                    render: function () {

                        // Create new underscore template
                        // collection = toJson data passed to the .createTemplate() method
                        var newTemplate = _.template($('#'+this.options.templateName).html(), {
                            collection: this.options.templateData,
                            settings: SnapsSpreadsheetOptions.userSettings
                        });

                        // if the 'this.options.classNames' exists inside '.js-MiniSnaps' element already 
                        // exists then update the html inside .js-MiniSnaps.  Otherwise 
                        // 'this.options.className' will need to be created and added to '.js-MiniSNaps'.
                        if (self.$('.'+this.options.className).length > 0) {

                            self.$('.'+this.options.className).html(newTemplate);

                        } else {

                            var newContainer = document.createElement('div');
                            
                            $(newContainer)
                                .addClass(this.options.className)
                                .html(newTemplate)
                                .appendTo(self.$el);

                        }

                        // return thisViewHtml;
                        return this;

                    }
                });

                // Loop through each array item and start building out our template 
                // HTML blocks and appending them to our master template HTML block

                // Instantiate a new instance of NewView().  Pass the templateName, templateData, 
                // tagName, and className to each new instance of NewView().
                for (var i = 0; i < templateLength; i++) {
                    
                    var templateName = templateArray[i].templateName;
                    var templateData = templateArray[i].templateData;
                    var templateContainer = templateArray[i].templateContainer;

                    var newView = new NewView({
                        templateName : templateName,
                        templateData : templateData,
                        tagName : 'div',
                        className : templateContainer
                    });

                    templateMiniSNAPS.push(newView);

                }
                
                // Once we've finished iterating through 'templateArray', return 
                // our array that stores all of the views we want to use to
                // re-paint the HTML inside the '.js-MiniSnaps' element
                return templateMiniSNAPS;
            },

            /*
             * Disable and Enable the selector's inputs.  Used when
             * a new ajax call must be made.  The selector will be
             * disabled while the data is being loaded, and then 
             * re-enabled when the ajax call is successful.
             * 
             * Method: toggleDisableUI
             */
            toggleDisableUI: function (){
                var disableUI = this.$('input, button, select').prop('disabled');

                if (disableUI === false) {
                    // Add a class MMM--inputIsDisabled, and disable the inputs, buttons, and select elements.
                    this.$('.js-snapsSel-inputLabel').addClass('MMM--inputIsDisabled');
                    this.$('input, button, select').prop('disabled', true);
                    // Add loaderGif.
                    this.$('.MMM--featuredBox').css({
                        'background-image' : 'url(' + loaderGif + ')',
                        'background-position' : '50% 50%',
                        'background-repeat' : 'no-repeat'
                    });
                    // Lower Opacity.
                    this.$('.js-snapsSel-topBox, .js-snapsSel-toggleBox').css({
                        'opacity' : 0.5
                    });
                } else {
                    //Remove class MMM--inputIsDisabled, and disable the inputs, buttons, and select elements.
                    this.$('.js-snapsSel-inputLabel').removeClass('MMM--inputIsDisabled');
                    this.$('input, button, select').prop('disabled', false);
                    // Remove loaderGif.
                    this.$('.MMM--featuredBox').css({
                        'background-image' : 'none',
                        'background-position' : '0% 0%',
                        'background-repeat' : 'no-repeat'
                    });
                    // Reset Opacity to normal.
                    this.$('.js-snapsSel-topBox, .js-snapsSel-toggleBox').css({
                        'opacity' : 1
                    });
                }
            },

            /**
             * For more information on events see: http://backbonejs.org/#View-delegateEvents
             */
            events: {
                'focus .js-snapsSel-zipCode': 'addInputFocusClass',
                'blur .js-snapsSel-zipCode': 'removeInputFocusClass',
                'click .js-snapsSel-loadMore': 'loadMoreResults',
                'click .js-snapsSel-toggleButton': 'toggleSearchBox',
                'change .js-snapsSel-dimensionSelect': 'changeDimensionSelections',
                'change .js-snapsSel-sortBy' : 'sortBy',
                'click .js-snapsSel-viewResults': 'viewResults',
                'click .js-snapsSel-resetSelector': 'resetSelector',
                'keyup .js-snapsSel-zipCode': 'submitZip'
            },

            /**
             * Method for adding a class to the parent <div> of 
             * an input[type="text"] element on focus.
             *
             * Method: addInputClass
             * Event Type: focus
             * Target Element: .js-snapsSel-zipCode
             */
            addInputFocusClass: function (event) {
                $(event.target).parent().addClass('mix-MMM--inlineBlockContainer-hasFocus');
            },

            /**
             * Method for removing a class to the parent <div> of an input[type="text"] element
             * and adding/removing a new class on a blur event. 
             *
             * The *-hasData class is added if the input element contains a value.
             * This keeps the styles in place, similiar to the *-hasFocus class.
             *
             * Method: removeInputFocusClass
             * Event Type: blur
             * Target Element: .js-snapsSel-zipCode
             */
            removeInputFocusClass: function (event) {
                $(event.target).parent().removeClass('mix-MMM--inlineBlockContainer-hasFocus');
                
                if (event.target.value.length > 0) {
                    $(event.target).parent().addClass('mix-MMM--inlineBlockContainer-hasData');
                } else {
                    $(event.target).parent().removeClass('mix-MMM--inlineBlockContainer-hasData');
                }
            },

            /**
             * Submit another ajax request to add more results to the
             * end of the results table.
             *
             * Method: loadMoreResults
             * Event Type: click
             * Target Element: .js-snapsSel-loadMore
             */
            loadMoreResults: function (event) {

                event.preventDefault();

                var self = this;

                // Keep track of the total results returned from the data.
                pageLoadMoreNumber = resultsPerPage + pageLoadMoreNumber;

                var newParams = {
                    'N': currentNval, //N is a URL Parameter required for the Ajax call
                    'includeRecords': 'true',
                    'No': pageLoadMoreNumber
                };

                var urlParams = $.extend({}, SnapsSpreadsheetOptions.defaultUrlParams, newParams),
                    $tableResults = this.$('.js-snapsSel-tableResults tbody', '.js-MiniSnaps')[0],
                    docFragment = document.createDocumentFragment(),
                    collectionToJSON = this.collection.toJSON()[0],
                    // Define our white list for 'whiteListedDisplayNames'.  'whiteListedDisplayNames' was defined/populated in the Model
                    whiteListedDisplayNames = collectionToJSON.whiteListedDisplayNames;

                var combinedColumns = SnapsSpreadsheetOptions.userSettings.combinedColumns;

                // The text value found in '.js-numOfResults', parsed into an integer.
                // It's also the number of results that are viewable on the page.
                numOfResults = parseInt( $('.js-numOfResults').text(), 10 );

                // Ajax call to load additional records and append them to the Results table
                this.collection.fetch({
                    url: self.collection.url,
                    dataType: 'jsonp',
                    jsonp:'jsonp',
                    jsonpCallback: 'dropDownSelectorInit',
                    processData: true,
                    data: urlParams,
                    beforeSend: function() {
                        // Disable UI before ajax initiates
                        self.toggleDisableUI();

                    },
                    success: function (data) {
                        // Define a length of new records since the last page of records might not be 20
                        var toJSON = data.toJSON()[0];
                        
                        // Number of records returned from a the ajax call.
                        var newRecordsLength = toJSON.records.length;

                        // Total number of results on the page. Displayed in the <span> tag
                        // with a class of '.js-numOfResults'.
                        numOfResults = numOfResults + newRecordsLength;
                        
                        // If the next page loaded has less than 20 results, update the "Load X More Results" button's text to whatever that number is
                        if(toJSON.totalResults - numOfResults < 20){
                            self.$('.js-resultsLeftToLoad').text(toJSON.totalResults - numOfResults);
                        }

                        // Update the number of results displayed.
                        if (newRecordsLength > 0) {
                            self.$('.js-numOfResults').text(numOfResults);
                        }

                        // When total results on the page (numOfResults) equals the 
                        // totalResults in the collection data remove the pagination
                        // button.  This is because we have reached the last of the
                        // results records in the collection data.
                        if ( numOfResults === parseInt(toJSON.totalResults, 10) ) {
                            self.$('.js-snapsSel-loadMore').remove();
                        }

                        for (var i = 0; i < newRecordsLength; i++) {

                            var newTableRow = document.createElement('tr'),
                                newRecordsAttrLength = toJSON.records[i].attributes.length;

                            for (var n = 0; n < newRecordsAttrLength; n++) {
                                var newTableCell = document.createElement('td'),
                                    newCellCol = toJSON.records[i].attributes[n],
                                    newCellColName = toJSON.records[i].attributes[n].name,
                                    newCellContent = toJSON.records[i].attributes[n].value;
                                
                                // Browsers greater than IE8 use textContent
                                // newTableCell.textContent = newCellContent;
                                // Browsers IE8 and lower use innerText
                                // newTableCell.innerText = newCellContent;
                                newTableCell.innerHTML = newCellContent;

                                // Populate the table row, if it meets the whitelist criteria
                                if (whiteListedDisplayNames.indexOf(newCellColName) > -1 && _.has(newCellCol, 'hideThisColumn') === false) {
                                    newTableRow.appendChild(newTableCell);
                                }
                                

                            }
                            // Add new set of results to the end of the table.
                            docFragment.appendChild(newTableRow);
                        }

                        // Append the new results
                        $tableResults.appendChild(docFragment);

                        // Enable UI once ajax is successful
                        self.toggleDisableUI();

                    },
                    error: function () {
                        console.log('pagination error');
                    }
                });

                return this;
            },

            /**
             * Toggle (Show/Hide) the drop down menus and set the text value of the 
             * Button that can control the toggle.
             *
             * Method: toggleSearchBox
             * Event Type: click
             * Target Element: .js-snapsSel-toggleButton
             */
            toggleSearchBox: function (event) {

                // Slide toggle the controls div and also toggle the text of our toggle button
                var $selToggleBtn = this.$('.js-snapsSel-toggleButton');


                this.$('.js-snapsSel-toggleBox').slideToggle('fast', function(){
                    // text === hideText.  Change it to showText
                    if($selToggleBtn.text() === hideText) {
                        $selToggleBtn.text(showText);
                        toggleButtonCurrText = showText;

                    }
                    // If it's empty, just set it's text to hideText, just to key off of.  This only happens once.
                    else if($selToggleBtn.text() === ''){
                        $selToggleBtn.text(showText);
                        toggleButtonCurrText = showText;

                    }
                    // text is not empty and its not hideText. Its' + $selToggleBtn.text()  + '. Change it to hideText
                    else {
                        $selToggleBtn.text(hideText);
                        toggleButtonCurrText = hideText;

                    }

                });


                return this;
            },

            /**
             * Selects the N-Value from the option selected in the 
             * drop down menu.  Make a new AJAX call with this new 
             * N-value to get the filtered results and load the selectors.
             *
             * Method: changeDimensionSelections
             * Event Type: change
             * Target Element: .js-snapsSel-dimensionSelect
             */
            changeDimensionSelections: function (event) {
                var selectedDimensionsArray = [];
                var $dimensionSelect = this.$('.js-snapsSel-dimensionSelect');

                $dimensionSelect.each(function(){
                    var dimensionName = $(this)[0].id,
                        selectedDimension = $(this).val();

                    selectedDimensionsArray.push({name: dimensionName, value: selectedDimension});
                });
                

                var refinementNVal = $(event.currentTarget).find('option:selected').data().refineurl.refinementUrl,
                    formatRefinementNVal = refinementNVal.substring(2);

                var newParams = {
                    'N': formatRefinementNVal, //N is a URL Parameter required for the Ajax call
                    'includeRecords': 'true',
                    'resultsPerPage': currentResultsPerPage,
                    'currSelectedDimensions' : selectedDimensionsArray
                };

                var renderTemplates = [
                    {
                        'templateName' : SnapsSpreadsheetOptions.userSettings.dimensionsTemplate,
                        'templateContainer' : 'dimensionsDiv'
                    }
                ];

                this.render(newParams, renderTemplates);
                

                return this;
            },
            /**
             * Send retrieve sorted results from SNAPS API 
             *
             * Method: sortBy
             * Event Type: change
             * Target Element: .js-snapsSel-sortBy
             */
            sortBy: function (event) {
                var targetValue = event.target.value;

                var newParams = {
                    'N': currentNval, //N is a URL Parameter required for the Ajax call
                    'includeRecords': 'true',
                    'resultsPerPage': numOfResults, // Keep the current number of results displayed. If 60 records are displayed we want 60 records to display again when the resultsTemplate is re-rendered.
                    'Ns': targetValue
                };

                var renderTemplates = [
                    {
                        'templateName' : SnapsSpreadsheetOptions.userSettings.resultsTemplate,
                        'templateContainer' : 'resultsDiv'
                    }
                ];

                this.render(newParams, renderTemplates);
                

                return this;
            },


            /**
             * Take the last used nVal and make a new ajax call, but this time 
             * set "includeRecords" to "true", so we can bring in our results
             *
             * Method: viewResults
             * Event Type: click
             * Target Element: .js-snapsSel-viewResults
             */
            viewResults: function (event) {
                toggleButtonIsHidden = false;
                
                this.$('.js-snapsSel-topBox').removeClass('MMM--isHidden');

                var zipCodeValue = this.$('.js-snapsSel-zipCode').val(),
                    distanceValue = this.$('.js-snapsSel-distance').val();


                this.toggleSearchBox();

                this.$('.js-snapsSel-searchedOn').text();


                var newParams = {
                    'N': currentNval,
                    'includeRecords': 'true',
                    'resultsPerPage': currentResultsPerPage,
                    'Ntx': 'mode%20matchall',
                    'Ntt': zipCodeValue,
                    'distance': distanceValue
                };
                
                var renderTemplates = [
                    {
                        'templateName' : SnapsSpreadsheetOptions.userSettings.resultsTemplate,
                        'templateContainer' : 'resultsDiv'
                    },
                    {
                        'templateName' : SnapsSpreadsheetOptions.userSettings.zeroResultsTemplate,
                        'templateContainer' : 'zeroResultsDiv'
                    }
                ];

                this.render(newParams, renderTemplates);

                return this;
            },

            /**
             * Reset the drop down menus to there initial state
             * and remove the results table.
             *
             * Method: resetSelector
             * Event Type: click
             * Target Element: .js-snapsSel-resetSelector
             */
            resetSelector: function (event) {
                event.preventDefault();

                // We want to reset the seletor to the intial state so we make sure that the toggle button
                // is hidden as well.  toggleButtonIsHidden is set to true to do this because the if()
                // logic  in the .render() method needs to bet to 'true' in order to hide it.
                toggleButtonIsHidden = true;
                
                var newParams = {
                    'N': baseNval
                };

                // Remove the Results Table.
                this.$('.resultsDiv').remove();

                var renderTemplates = [
                    {
                        'templateName' : SnapsSpreadsheetOptions.userSettings.dimensionsTemplate,
                        'templateContainer' : 'dimensionsDiv'
                    },
                    {
                        'templateName' : SnapsSpreadsheetOptions.userSettings.zeroResultsTemplate,
                        'templateContainer' : 'zeroResultsDiv'
                    }
                ];

                this.render(newParams,renderTemplates);

                return this;
            },
            
            /**
             * Request data from the SNAPS API based on the postal code
             * that was entered.
             *
             * Method: submitZip
             * Event Type: keyup
             * Target Element: .js-snapsSel-zipCode
             */
            submitZip: function (event) {

                // Keycode === 13 is the 'Enter' key on the keyboard
                if(event.keyCode === 13) {

                    toggleButtonIsHidden = false;

                    this.$('.js-snapsSel-topBox').removeClass('MMM--isHidden');

                    // Hide the Menu Selectors when the user hit's the 'Enter' button.
                    this.toggleSearchBox();

                    var zipCodeValue = event.target.value,
                        distanceValue = this.$('.js-snapsSel-distance').val();


                    var newParams = {
                        'N': currentNval,
                        'includeRecords': 'true',
                        'resultsPerPage': currentResultsPerPage,
                        'Ntx': 'mode%20matchall',
                        'Ntt': zipCodeValue,
                        'distance': distanceValue
                    };

                    var renderTemplates = [
                        {
                            'templateName' : SnapsSpreadsheetOptions.userSettings.resultsTemplate,
                            'templateContainer' : 'resultsDiv'
                        },
                        {
                            'templateName' : SnapsSpreadsheetOptions.userSettings.zeroResultsTemplate,
                            'templateContainer' : 'zeroResultsDiv'
                        }
                    ];

                    this.render(newParams, renderTemplates);

                    return this;
                }
            }

        });

        /**
         * Set up function to create a new instance of SpreadsheetDropdownView
         *
         * Method: setupView
         * Returns: dropdownView.render(null, initialTemplateRender)
         */
        var setupView = function () {
            var initialTemplateRender = [
                {
                    'templateName' : SnapsSpreadsheetOptions.userSettings.dimensionsTemplate,
                    'templateContainer' : 'dimensionsDiv'
                },
                {
                    'templateName' : SnapsSpreadsheetOptions.userSettings.zeroResultsTemplate,
                    'templateContainer' : 'zeroResultsDiv'
                }
            ];

            var dropdownView = new SpreadsheetDropdownView();

            // First Parameter in .render() is the URL Parameters for the ajax call. This is null on the inital page load.
            // Second Parameter in the .render() is the script templates to load on the initial page load.
            return dropdownView.render(null, initialTemplateRender);
        };

        /**
         *  Fire the .render() method in the new instance of SpreadsheetDropdownView
         */
        return setupView();

    });

}(MMMRequire));