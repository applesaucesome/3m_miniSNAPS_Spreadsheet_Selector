<?php include '../includes/header-country.php'; ?>

<script type="text/javascript">
    setPageJS('dev');

    loadPageModule('kungfu/Mini-SNAPS/SpreadsheetDropdownView');
</script>


<script type="text/template" id="rSel-02-Dropdown">
    <div class="MMM--featuredBox MMM--relativePosition">

        <div class="MMM--snapsSelBox-top js-snapsSel-topBox">
            <div class="clearfix">
                <p class="MMM--snapsSel-FloatLeft js-snapsSel-searchedOn"><span style="font-weight: bold;"><%- settings.label_searchedOn %></span>
                <% _.each(collection.currSelectedDimensions, function(value, key, list){ %>
                <!-- If both 'label_select' and 'label_deselect' are not found at position 0 in 'value.value', allow them to be rendered in the '.js-snapsSel-searchedOn' span -->
                    <% if(!value.value.indexOf(settings.label_select) < 1 && !value.value.indexOf(settings.label_deselect) < 1) { %>
                        <%= value.name.italics() + ' - ' + value.value %>
                        <% var listLength = _.size(list) - 1; %>
                        <% if(key < listLength){ %>
                            <strong>|</strong>
                        <% } %>                        
                    <% } %>
                <% }); %>
                </p>
                <button type="button" class="js-snapsSel-toggleButton MMM--snapsSel-BlockToFloatRight"></button>
            </div>
        </div>

        <div class="MMM--snapsSelBox js-snapsSel-toggleBox">
            <h2 class="hdg hdg_2 MMM--snapsSelBox-title"><%- settings.label_heading %></h2>
            <!-- Start Dropdowns and their associated Descriptions -->

            <p class="MMM--gapTop"><%- settings.label_descriptionText %></p>

            <div class="MMM--gapTop">
            <% 
                _.each(collection.dimensions, function(element, index, list) { 
            %>
            
                <!-- We use 'selectBuilt' to control creating only a single 'Select' option per dropdown -->
                <% var selectBuilt; %>
                
                <!-- If the dimension has a property of 'autoSelected', then that is the only result available, so disable it. -->
                <div class="MMM--gapBottom">
                    <select class="js-snapsSel-dimensionSelect" id="<%- element.name %>" <% if (element.autoSelected === "true") { %> disabled <% } %>>
            
                <!-- If the dimension has a propery of 'selected' and its true, create a de-select option -->
                <%  
                    _.each(element.refinements, function(elem, i){
          
                        if (elem.selected === 'true') {
                %>

                        <option class="MMM--snapsSel-dimensionOption" data-refineurl='{
                                "nVal": "<%- elem.nval %>",
                                "refinementUrl": "<%- elem.removeUrl %>"
                            }'><%- settings.label_deselect %></option>
                        
                        <!-- Otherwise if the dimension doesnt have the 'selected' property and its not true, build out a 'Select' dropdown option once and then update the 'selectBuild' variable to true so that it doesnt keep creating them each iteration -->
                        <% } else if (selectBuilt !== true) { %>

                            <option><%- settings.label_select %> <%- element.name %></option>

                <% 
                            selectBuilt = true;

                        } 
                %>
                        <!-- Build out the refinement options to populate the dropdowns -->
                        <option <% if (elem.selected === 'true') { %> selected <% } %> data-refineurl='{
                            "refinementUrl": "<%- elem.refineUrl %>",
                            "nVal": "<%- elem.id %>",
                            "removeUrl": "<%- elem.removeUrl %>"
                        }'><%- elem.name %></option>


            <% 
                }); 
            %>

                    </select>


                <% 
                    // list = collection.dimensions
                    //
                    // Check the collection.dimensions length for the last dimension.
                    // If we are on the last dimension create an input text field
                    // for the Zip Code input box.
                    if (index == list.length - 1) {
                %>
                        <%- settings.label_or %> 
                            <div class="MMM--inlineBlockContainer mix-MMM-inlineBlockContainer-width95px">
                                <label class="MMM-transition-all MMM--inlineBlockContainer-label js-snapsSel-inputLabel" for="snapsSel-zipCode"><%- settings.label_postalCode %></label>
                                <input id="snapsSel-zipCode" class="js-snapsSel-zipCode MMM-transition-all MMM--snapsSel-zipCode" type="tel" name="zip" value="">
                            </div>
                <%
                    } 
                %>

                </div>
                <!-- /MMM--gapBottom -->

            <% }); %>
            </div>
            <!-- End Dropdowns and their associated Descriptions -->
            

            <!-- Start Zip/Distance -->
            
            <% 
                /**
                 * Check to see if 'settings.postalCodeSearchDistance' is an Array using
                 * UnderscoreJS _.isArray() function.
                 * If 'settings.postalCodeSearchDistance' is not an array then split it
                 * based on commas to make it an array.
                 */
                var postalCodeSearchDistance = settings.postalCodeSearchDistance;
                if ( _.isArray(postalCodeSearchDistance) === false ) { 
                    postalCodeSearchDistance = postalCodeSearchDistance.split(',');
                } 
            %>

            <% 
                /**
                 * if 'postalCodeSearchDistance.length' is greater than 1, create a 
                 * select dropdown menu otherwise create a hidden input field 
                 * with only 1 value for the zipcode search distance.
                 */
                 if (postalCodeSearchDistance.length > 1) { 
            %>
                    <div class="MMM--gapBottom">
                        <%- settings.label_distance %>
                        <select class="js-snapsSel-distance">   
                            <% _.each(postalCodeSearchDistance, function (element, index) { %>
                                <option value="<%- element %>"><%- element %></option>
                            <% }); %>               
                        </select>
                    </div>
            <% 
                } else if (postalCodeSearchDistance.length === 1) { 
            %>
                    <input type="hidden" class="js-snapsSel-distance" value="<%- postalCodeSearchDistance %>" />
            <% 
                } 
            %>
            <!-- End Zip/Distance -->
            

            <!-- Start View Results/Reset buttons -->
            <div class="MMM--snapsSelButtonContainer">
                <div class="MMM--gapBottom">
                    <button class="js-snapsSel-viewResults MMM--btn mix-MMM--btn_fullWidthMobileOnly" type="button"><%- settings.label_viewResults %></button>
                </div>

                <a href="#" class="js-snapsSel-resetSelector"><%- settings.label_reset %></a>

            </div>
            <!-- End View Results/Reset buttons -->

        </div>
        <!-- /MMM--snapsSelBox -->

    </div>
    <!-- /MMM--featuredBox -->
</script>

<script type="text/template" id="rSel_R-01-Table">
    <% 
        var whiteListedDisplayNames = collection.whiteListedDisplayNames,
            previousCellName; 
    %>

    <!-- Start Results Table -->
    <div class="clearfix">       
        <div class="MMM--snapsSel-FloatLeft">
            <%- settings.label_sortBy %> 
            <select class="js-snapsSel-sortBy">
                <option><%- settings.label_selectSort %></option>
                <% 
                    _.each(collection.columns, function(element, index) { 
                        if ( whiteListedDisplayNames.indexOf(element.name) > -1 ) {
                %>
                            <option class="js-snapsSel-sortBy_optionAscending" value="<%- element.sortByName %>|0"><%- element.displayName %> <%- settings.label_ascendingAbbreviation %></option>

                            <option class="js-snapsSel-sortBy_optionDescending" value="<%- element.sortByName %>|1"><%- element.displayName %> <%- settings.label_descendingAbbreviation %></option>
                <% 
                        }
                    }) 
                %>
            </select>
        </div>
        <div class="MMM--snapsSel-BlockToFloatRight">

        <% if (collection.records.length > 1) { %>
            1-<span class="js-numOfResults"><%- collection.records.length %></span>
        <% } else { %>
            <span class="js-numOfResults"><%- collection.records.length %></span>
        <% } %>
            <%- settings.label_of %> <%- collection.totalResults %> <%- settings.label_matches %>
        </div>
    </div>

    <div class="js-snapsSel-multiColResults MMM--snapsSel-tableContainer MMM--snapsSel-tableMultiCol MMM--gapTopMed rSel_R-01-Table">

        <table class="js-snapsSel-tableResults">
            <thead>
                <tr>
                    <% 
                        _.each(collection.columns, function (element, index) {
                            if (_.has(element,'hideThisColumn') === false) {
                    %>
                        
                                <th class="MMM--snapsSelTableHeader MMM--selectorTableHeader<%- index %>"><%= element.displayName %></th>

                    <% 
                            }
                        }); 
                    %> 
                </tr>
            </thead>
            <tbody>
            <% _.each(collection.records, function(element, index) { %>
                <tr class="MMM--snapsSelRow MMM--selectorTableRow<%- index %>">
                    <% _.each(element.attributes, function(value, key) { %>
                        <% 
                            // Only create cells if their column name is listed in the ss.displayNames parameter
                         
                            // displayTheseCells = whitelist of spreadsheet data to display
                            // based on the 'ss.displayNames'.
                            // Underscores _.has() method is used to see if the object of column
                            // data has a property called 'hideThisColumn'
                            if (whiteListedDisplayNames.indexOf(value.name) > -1 && _.has(value, 'hideThisColumn') === false) { 
                        %>
                            <td class="MMM--snapsSelCell MMM--selectorTableCell<%- key %>" data-name="<%- value.name %>">
                                <% if (value.name === 'gmaps address') { %>
                                    <p>
                                        <a target='_blank' href='https://maps.google.com/?q=<%- value.value %>'>
                                            <img src="http://maps.googleapis.com/maps/api/staticmap?<%- value.value %>&zoom=12&size=100x100&sensor=false&markers=color:red%7C<%- value.value %>&key=AIzaSyB2mgcDVEVr7W1LFcOHxgHm7G0YqnzFE3E" />
                                        </a>
                                    </p>
                                <% } else { %>                                    
                                    <p><%= value.value %></p>
                                <% } %>
                            </td>
                        <% 
                            } 
                        %>

                    <% }); %>
                </tr>
            <% }); %>
            </tbody>
        </table>
    </div>
    <!-- End Results Table -->

    <!-- Start Pagination controls --> 
    <div class="MMM--txtCentered">
        <button class="js-snapsSel-loadMore MMM--gapBottom MMM--btn mix-MMM--btn_fullWidthMobileOnly">
            <%- settings.label_showNext %> <span class="js-resultsLeftToLoad">20</span> <%- settings.label_of %> <%- collection.totalResults %>
        </button>
    </div>
    <!-- End Pagination controls -->
</script>

<script type="text/template" id="zeroResults">
    <!-- Start  Zero-Results -->
    <div class="MMM--gapTopMed js-snapsSel-zeroResults">
        <table class="tableResults">
            <thead>
                <tr>
                    <th>no results</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                   <td>Zero records found</td>
                </tr>
            </tbody>
        </table>
    </div>
    <!-- End  Zero-Results -->
</script>

<div class="MMM--site-bd">

    <!-- Portlet ID -->
    <div class="component-control id-Z7_RJH9U52300FC40IQG8LGQL1TP7">
        <span id="Z7_RJH9U52300FC40IQG8LGQL1TP7"></span>

        <!-- Start: Container Div -->
        <div class="rSel-02-Dropdown MMM--contentWrapper MMM--contentWrapper_padded">

            <h1 class="MMM--hdg MMM--hdg_1 mix-MMM--hdg_spaced">ESPE Selector - Dropdowns</h1>

                    <div class="js-MiniSnaps MMM--miniSnapsWrapper MMM--wysiwyg" data-options='{
                        "dimensionsTemplate" : "rSel-02-Dropdown",
                        "resultsTemplate" : "rSel_R-01-Table",
                        "environment" : "previewext",
                        "previewextNval" : "4293001030",
                        "solutionsNval" : "4293001030",

                        "label_searchedOn": "You searched on:",
                        "label_toggleBtn_ShowText" : "Search Again",
                        "label_toggleBtn_HideText" : "Hide Search",
                        "label_descriptionText" : "\&#34;Space\&#34;: the &#39;final&#39; frontier. These are the voyages of the starship Enterprise. Its continuing mission: to explore strange new worlds, to seek out new life and new civilizations, to boldly go where no one has gone before.",
                        "label_heading": "Search for dental labs near you:",
                        "label_select": "Select",
                        "label_deselect": "De-select",
                        "label_or": "or",
                        "label_postalCode": "Zip Code",
                        "postalCodeSearchDistance": "10,20,30,40,50",
                        "label_distance": "Select Distance",
                        "label_viewResults": "View Results",
                        "label_reset": "Reset",
                        "label_showNext":"Show Next",
                        "label_of": "of",
                        "label_matches": "Matches",
                        "label_sortBy": "Sort by:",
                        "label_selectSort": "-- Select Sort --",
                        "label_ascendingAbbreviation": "Asc.",
                        "label_descendingAbbreviation": "Desc.",
                        "label_primaryButtonText": "Select Participating Lab",
                        "label_secondaryButtonText": "Secondary Button",
                        "label_tertiaryButtonText": "Tertiary Button",

                        "ss.displayNames" : "Lab Name$$$lab name||Product or Capability$$$Product/Capability||Lab State$$$Lab State||MMM-phone$$$MMM-phone||MMM-primary-button$$$MMM-primary-button",

                        "ss.displayLinks" : "lab name$$$url||MMM-phone$$$MMM-phone||MMM-primary-button$$$MMM-primary-button",

                        "combinedColumns" : "lab name[<br>]+lab address+Lab State+postal code[<br>]+MMM-phone[<br>]+MMM-primary-button",

                        "usage" : "ss"
                    }'>
                </div>
                <!-- /js-MiniSnaps -->

        </div>
        <!-- /MMM--contentWrapper -->
        <!-- End: Container Div -->
        
    </div>

    <?php include 'testDropdownSelector-Form.php'; ?>    

</div>
<!-- /site-bd -->

<?php include '../includes/footer-components/footer-4col.php'; ?>
<?php include_once '../includes/foot.php'; ?>