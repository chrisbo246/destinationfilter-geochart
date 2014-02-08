/*jslint browser: true */
/*global $, jQuery, google*/

// https://developers.google.com/chart/interactive/docs/gallery/geomap
//google.load('visualization', '1', {packages: ['geochart']});

var dialog, dialogStrings = {}, geochart, geochartDatas, dialogStrings;

var countryInfoDB = 'json/geonamesorg_country_info.json';

var geochartOptions = {
        region: 'world',
        displayMode: 'auto', // auto regions markers  //dataMode: 'auto', // auto regions markers
        //resolution: 'continents', // -continents -subcontinents countries provinces metros
        width: '100%',
        height: '100%',
        //colors:['#FF8747', '#FFB581', '#c06000'],
        //colors: ['#EEEEEE', '#478747', '#87FF47'],
        //colorAxis: {colors: ['green', 'blue']}
        backgroundColor: '#06d',
        //backgroundColor.fill: 'green',
        datalessRegionColor: 'red',
        showLegend: true,
        showZoomOut: true,
        zoomOutLabel: true
    };

var dialogOptions = {
        //title: "Country",
        position: {
            my: "right top",
            at: "right top",
            of: "#geochart"
        },
        autoOpen: false,
        //buttons: [ { text: "Fermer", click: function() { $( this ).dialog( "close" ); } } ],
        closeOnEscape: false,
        closeText: "close", // close hide
        dialogClass: "dialog info",
        draggable: true,
        hide: "explode",
        width: '25%',
        //height: 200,
        //maxHeight: '70%',
        //maxWidth: '70%',
        //minHeight: 200,
        //minWidth: 300,
        modal: false,
        resizable: false,
        show: "slow"
        //appendTo: "#someElem",
    };

var tabsOptions = {
        active: false,
        collapsible: false,
        disabled: false,
        event: "click",
        //heightStyle: "fill",
        maxHeight: '70%'
    };

var sortableOptions = {
        axis: "y",
        containment: "parent",
        cursor: "move",
        items: "li", //:not(.disabled)
        cancel: ".disabled",
        //placeholder: "ui-sortable-placeholder",
        update: function () {
            "use strict";
            $(function () {
                $.cookie('priorities', $(this).sortable("toArray").join());
            });
        }
    };


/**
 * Return length of a JSON object
 */
function jsonLength(json) {
    "use strict";
    var key, count = 0;
    for (key in json) {
        if (json.hasOwnProperty(key)) {
            count += 1;
        }
    }
    return count;
}


/**
 * Get input value if available or set a default value
 */
function syncInputValue(selector, value) {
    "use strict";
    if ($(selector) && $(selector).val() !== '') {
        value = $(selector).val();
    } else {
        $(selector).val(value);
    }
    return value;
}


/**
 * Fill a select input from a JSON file
 */
function appendOptions(selector, url, value, text, blank) {
    "use strict";
    $.getJSON(url, function (JSONDatas) {
        if (JSONDatas !== null) {

            // Remove previous options
            $(selector + ' option').remove();

            // Sort datas
            JSONDatas.sort(function (a, b) {
                var x = a[value], y = b[value];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });

            // Add a top option
            if (blank !== null) {
                $(selector).append(new Option('', blank));
            }

            // Append options (omit duplicate values)
            var unique = [];
            $.each(JSONDatas, function (i, v) {
                if ($.inArray(v[value], unique) === -1) {
                    unique.push(v[value]);
                    $(selector).append(new Option(v[text], v[value]));
                }
            });

        }
    });
}


/**
 * Open a dialog box and display infos about country
 */
function drawInfos(datas) {
    "use strict";

    var template = '<div id="dialog-tabs">'
            + '  <ul>'
            + '    <li><a href="#matches-tab">Matches</a></li>'
            + '    <li><a href="#details-tab">Details</a></li>'
            + '  </ul>'
            + '  <div id="matches-tab" class="widget">'
            + '    <ul>';
    $.each($("#priorities").sortable('toArray'), function (i, value) {
        if ($.inArray(value, datas.priorities) >= 0) {
            template = template + '      <li><strong>' + $('#' + value).html() + '</strong></li>';
        } else {
            template = template + '      <li><del>' + $('#' + value).html() + '</del></li>';
        }
    });
    template = template + '    </ul>'
        + '  </div>'
        + '  <div id="details-tab" class="widget">'
        + '    <dl class="dl-horizontal">'
        + '      <dt>ISO code</dt><dd>' + datas.ISO + ' ' + datas.ISO3 + ' ' + datas['ISO-Numeric'] + '</dd>'
        + '      <dt>FIPS code</dt><dd>' + datas.fips + ' ' + datas.EquivalentFipsCode + '</dd>'
        + '      <dt>Capital</dt><dd>' + datas.Capital + '</dd>'
        + '      <dt>Currency</dt><dd>' + datas.CurrencyName + ' (' + datas.CurrencyCode + ')</dd>'
        + '      <dt>Phone prefix</dt><dd>' + datas.Phone + '</dd>'
        + '      <dt>Languages</dt><dd>' + datas.Languages + '</dd>'
        + '      <dt>Visa-free</dt><dd>' + datas['visa-free'] + ' days</dd>'
        + '      <dt>Visa-on-arrival fee</dt><dd>' + datas['voa-fee'] + '</dd>'
        + '      <dt>AC plug type</dt><dd>' + datas.plug_type + '</dd>'
        + '      <dt>AC voltage</dt><dd>' + datas.residential_voltage + 'V</dd>'
        + '      <dt>Frequency</dt><dd>' + datas.frequency + 'Hz</dd>'
        + '    </dl>'
        + '  </div>'
        + '</div>'
        + '<button id="zoom-in" class="btn btn-primary btn-block">Zoom in</button>'
        + '<button id="zoom-out" class="btn btn-default btn-block">Zoom out</button>';

    dialog.html(template);
    dialog.dialog("option", "title", datas.Country);
    dialog.dialog('open');
    $("#dialog-tabs").tabs(tabsOptions);

    /*
<dt class="hidden">geonameid</dt><dd>' + datas.geonameid + '</dd>'
 + '<dt>Area</dt><dd>' + datas['Area(in sq km)'] + 'km<exp>2</exp></dd>'
 + '<dt>Population</dt><dd>' + datas.Population + '</dd>'
 + '<dt>Continent</dt><dd>' + datas.Continent + '</dd>'
 + '<dt>Postal Code Format</dt><dd>' + datas['Postal Code Format'] + '</dd>'
 + '<dt class="hidden">Postal Code Regex</dt><dd>' + datas['Postal Code Regex'] + '</dd>'
 + '<dt>Neighbours</dt><dd>' + datas.neighbours + '</dd>'
 + '<dt>Languages</dt><dd>' + $.unique(datas.Languages.replace(/[_-]+[a-zA-Z]+/g, "").split(',')).join(',') + '</dd>'
 + '<dt>tld</dt><dd>' + datas.tld + '</dd>'
 + '<dt>Visa-free</dt><dd>' + datas['visa-free'] + ' days</dd>';
*/

}


/**
 * Draw map
 */
function drawVisualization() {
    "use strict";

    var datas = {}, rows = [], priority = {}, queryParams = $("#priorities").sortable('toArray');

    // Query parameters priorities
    $.each(queryParams, function (i, value) {
        priority[value] = queryParams.length - i;
    });

    // Disable async for getJSON calls
    $.ajaxSetup({
        async: false
    });

    // Load JSON file and calculate score for each country and build infos string
    $.getJSON(countryInfoDB, function (jsonData) {
        if (jsonData !== null) {
            $.each(jsonData, function (i, v) {

                datas[v.ISO] = [];
                datas[v.ISO][0] = v.Country;
                datas[v.ISO][1] = 0;
                /*datas[v.ISO][2] = '';
        datas[v.ISO][3] = '';
        datas[v.ISO][4] = '';
        datas[v.ISO][5] = '';*/

                //dialogStrings[v.ISO] = template;
                dialogStrings[v.ISO] = v;
                dialogStrings[v.ISO].priorities = [];

                if ($('#currency_code').val() !== undefined && $('#currency_code').val() === v.CurrencyCode) {
                    datas[v.ISO][1] += priority.currency_priority;
                    //dialogStrings[v.ISO]['priorities'].push($('#currency_priority').html() + ' (' + $('#currency_code').val() + ')');
                    dialogStrings[v.ISO].priorities.push('currency_priority');
                }
                if ($('#language_code').val() !== undefined && v.Languages !== null && $.intersect($('#language_code').val().join(',').replace(/[_\-]+[a-zA-Z]+/g, "").split(','), [v.Languages.replace(/[_\-]+[a-zA-Z]+/g, "").split(',').shift()]).length > 0) {
                    datas[v.ISO][1] += priority.language_priority;
                    //dialogStrings[v.ISO]['priorities'].push($('#language_priority').html() + ' (' + $('#language_code').val() + ')');
                    dialogStrings[v.ISO].priorities.push('language_priority');
                }
                if ($('#language_code').val() !== undefined && $.intersect($('#language_code').val().join(',').replace(/[_\-]+[a-zA-Z]+/g, "").split(','), v.Languages.replace(/[_\-]+[a-zA-Z]+/g, "").split(',')).length > 0) {
                    datas[v.ISO][1] += priority.secondary_language_priority;
                    //dialogStrings[v.ISO]['priorities'].push($('#secondary_language_priority').html());
                    dialogStrings[v.ISO].priorities.push('secondary_language_priority');
                }
                if ($('#country_code').val() !== undefined && $.inArray($('#country_code').val(), v.neighbours.split(',')) !== -1) {
                    datas[v.ISO][1] += priority.neighbour_priority;
                    //dialogStrings[v.ISO]['priorities'].push($('#neighbour_priority').html());
                    dialogStrings[v.ISO].priorities.push('neighbour_priority');
                }

            });
        }
    });

    $.getJSON('json/visa.json', function (jsonData) {
        if (jsonData !== null) {
            $.each(jsonData, function (i, v) {
                if ( datas[v.ISO] !== undefined ) {
                    //datas[v.ISO][6] = '';
                    $.each(v.countries, function (i, country) {
                        if ($('#country_code').val() === country.ISO) {

                            if (country['visa-free'] !== undefined) {
                                datas[v.ISO][1] += priority['visa-free_priority']; //+ (country['visa-free'] / 1000)
                                //dialogStrings[v.ISO]['priorities'].push($('#visa-free_priority').html() + ' (' + country['visa-free'] + ' days)');
                                dialogStrings[v.ISO].priorities.push('visa-free_priority');
                            }

                            $.extend(dialogStrings[v.ISO], country);
                        }
                    });
                }
            });
        }
    });

    $.getJSON('json/ac.json', function (jsonData) {
        if (jsonData !== null) {
            $.each(jsonData, function (i, v) {
                if ( datas[v.ISO] !== undefined ) {
                
                    if ($('#ac_plug').val() !== undefined && $.intersect($('#ac_plug').val().split(','), v.plug_type.split(',')).length > 0) {
                        datas[v.ISO][1] += priority.ac_plug_priority;
                        //dialogStrings[v.ISO]['priorities'].push($('#ac_plug_priority').html());
                        dialogStrings[v.ISO].priorities.push('ac_plug_priority');
                    }
                    if ($('#ac_voltage').val() !== undefined && $.intersect($('#ac_voltage').val().split(','), v.residential_voltage.split(',')).length > 0) {
                        if ($('#ac_frequency').val() !== undefined && $.intersect($('#ac_frequency').val().split(','), v.frequency.split(',')).length > 0) {
                            datas[v.ISO][1] += priority.ac_voltage_priority;
                            //dialogStrings[v.ISO]['priorities'].push($('#ac_voltage_priority').html());
                            dialogStrings[v.ISO].priorities.push('ac_voltage_priority');
                        }
                    }
                    /*if ( $('#ac_frequency').val() !== undefined && $.intersect($('#ac_frequency').val().split(','), v.frequency.split(',')).length > 0) {
              datas[v.ISO][1] += priority['ac_plug_priority'];
              dialogStrings[v.ISO]['priorities'].push($('#ac_frequency_priority').html());
            }*/

                    $.extend(dialogStrings[v.ISO], v);
                }
            });
        }
    });

    //document.write(JSON.stringify(datas));exit;

    // Build geochart data table
    geochartDatas = new google.visualization.DataTable();
    geochartDatas.addColumn('string', 'Country');
    geochartDatas.addColumn('number', 'Score');
    /*geochartDatas.addColumn('string', '2');
  geochartDatas.addColumn('string', '3');
  geochartDatas.addColumn('string', '4');
  geochartDatas.addColumn('string', '5');*/
    //geochartDatas.addColumn('string', '6');
    /*geochartDatas.addRows(jsonLength(datas));

  var i = 0;
  $.each(datas, function (k, array) {
    $.each(array, function (j, v) {
      //geochartDatas.setValue(i, 0, v.title);
      //geochartDatas.setValue(i, 1, v.score);
      geochartDatas.setValue(i, j, v.score);
      i = i + 1;
    });
  });*/

    //rows.push(['Country', 'Score', '2', '3', '4', '5']);
    $.each(datas, function (k, array) {
        rows.push(array);
    });
    geochartDatas.addRows(rows);

    // Draw map
    geochart.draw(geochartDatas, geochartOptions);

    // Display country list sorted by score
    rows.sort(function (a, b) {
        return b[1] - a[1];
    });
    $('#results li').remove();
    $.each(datas, function (k, array) {
        if (array[1] > 0) {
            $('#results').append('<li data-id="' + k + '">' + array[1] + ' - ' + array[0] + '</li>');
        }
    });
    $('#results li').hover(
        function () {
            //$( this ).append( $( "<span> ***</span>" ) );
            var id = $(this).attr("data-id");
            google.visualization.events.trigger(geochart, 'regionClick', {
                region: id
            });
        }/*,
        function () {
            $( this ).find( "span:last" ).remove();
        }*/
    );

}


/**
 * Load Google visualization library
 */
google.load('visualization', '1', {
    packages: ['geochart']
});


/**
 * jQuery
 */
$(function () {
    "use strict";

    // Populate form fields
    appendOptions('#country_code', countryInfoDB, 'ISO', 'Country', '');
    appendOptions('#passport_country_code', countryInfoDB, 'ISO', 'Country', '');
    appendOptions('#currency_code', countryInfoDB, 'CurrencyCode', 'CurrencyName', '');
    appendOptions('#language_code', 'json/language-a2.json', 'id', 'text', '');
    appendOptions('#ac_plug', 'json/ac_plug.json', 'id', 'text', '');
    appendOptions('#ac_voltage', 'json/ac_voltage.json', 'id', 'text', '');
    appendOptions('#geochart_region', 'json/google_regions.json', 'id', 'name', '');
    //appendOptions('#currency_code','json/currency.json','id','text','');
    //appendOptions('#secondary_language_code', 'json/language-a2.json', 'id', 'text', '');
    //appendOptions('#language_code',countryInfoDB,'Languages','CurrencyName','');

    // Restore sortable priorities from cookies
    if ($.cookie("priorities")) {
        $.each($.cookie("priorities").split(','), function (i, id) {
            $("#" + id).appendTo($("#priorities"));
        });
    }

    // When all ajax requests are done
    $(document).ajaxStop(function () {

        // Restore form values from cookies
        $(this).unbind("ajaxStop");
        $('#home_form, #profile_form, #settings_form').sayt({
            'autosave': true,
            'autorecover': true,
            'days': 7
        });

        // Customize map options using settings
        //geochartOptions.displayMode = syncInputValue('#geochart_display_mode',geochartOptions.displayMode);
        //geochartOptions.resolution = syncInputValue('#geochart_resolution',geochartOptions.resolution);
        geochartOptions.region = syncInputValue('#geochart_region', geochartOptions.region);

        // Once Google library had been loaded
        google.setOnLoadCallback(function () {

            var previousRegion, previousResolution;

            geochart = new google.visualization.GeoChart(document.getElementById('geochart'));

            // On region double-click
            google.visualization.events.addListener(geochart, 'regionClick', function (eventData) {
                previousRegion = geochartOptions.region;
                previousResolution = geochartOptions.resolution;
                // Zoom on region
                //geochartOptions['region'] = eventData.region;
                //drawVisualization();
                // Show dialog box
                //alert(eventData.region);
                //alert(eventData.region);
                drawInfos(dialogStrings[eventData.region]);

                // Zoom in/out button in dialog box
                $("#zoom-in").click(function () {
                    previousRegion = geochartOptions.region;
                    geochartOptions.region = eventData.region;
                    drawVisualization();
                });
                $("#zoom-out").click(function () {
                    geochartOptions.region = previousRegion;
                    drawVisualization();
                });

            });

            /*google.visualization.events.addListener(geochart, 'select', function() {
        var selection = geochart.getSelection();
        // if same city is clicked twice in a row
        // it is "unselected", and selection = []
        if(typeof selection[0] !=== "undefined") {
          var value = newInfo.getValue(selection[0].row, 0);
          alert('City is: ' + value);
        }
      });*/

            // Restore previous options when user click out of region
            /*google.visualization.events.addListener(geochart, 'error', function () {
                geochartOptions.region = previousRegion;
                geochartOptions.resolution = previousResolution;
                geochart.draw(geochartDatas, geochartOptions);
            });*/

            // Refresh geochart when click refresh button
            $("#refresh").click(function () {
                drawVisualization();
            });

            // Draw geochart once input values had been restored
            drawVisualization();
        });

    });

    // Populate profile when user change his country
    $("#country_code").change(function () {

        $.getJSON(countryInfoDB, function (jsonData) {
            $.each(jsonData, function (i, v) {
                if ($('#country_code').val() === v.ISO) {
                    $('#passport_country_code').val(v.ISO).change();
                    $('#language_code').val(v.Languages.match('^[a-zA-Z]+')).change();
                    //$('#secondary_language_code').val(v.Languages.match('^[a-zA-Z]+')).change();
                    $('#currency_code').val(v.CurrencyCode).change();
                }
            });
        });

        $.getJSON('json/ac.json', function (jsonData) {
            $.each(jsonData, function (i, v) {
                if ($('#country_code').val() === v.ISO) {
                    $('#ac_plug').val(v.plug_type.split(',').shift()).change();
                    $('#ac_voltage').val(v.residential_voltage.split(',').shift()).change();
                    $('#ac_frequency').val(v.frequency.split(',').shift()).change();
                }
            });
        });

    });

    // Tabs
    $("#tabs").tabs(tabsOptions);
    // Open profile tab if empty
    /*if ($("#country_code").val() === '') {
    $("#home-tab").tabs('option', 'active', true);
  }*/

    // Sortable
    //$('#priorities li:not(.disabled)').prepend('<span class="ui-icon ui-icon-arrowthick-2-n-s"></span>');
    $("#priorities").sortable(sortableOptions);

    // Dialog
    dialog = $('<div />', {
        id: 'dialog1'
    }).appendTo('#geochart').dialog(dialogOptions);

});