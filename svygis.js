var _svyGIS = angular.module("svy.gis", ["svy.web","ui.bootstrap"]);

////    TOC Components
_svyGIS.directive("toc", ["$svyGIS", function ($svyGIS) {
    return {
        restrict: "E",
        templateUrl: "/comm/api/svylib/tpls/gisTOC.html?uuid=" + svyUUID(),
        scope: { "showdatasource": "=" },
        link: function (scope, element, attrs) {
            scope.attr = {
                show: { basemap: false, feature: true },
                basemaps: new Array(),
                features: new Array()
            }

            scope.$on("mapprepared", function (event, args) {
                scope.attr.basemaps = $svyGIS.getbasemaps();
                scope.attr.features = $svyGIS.getfeatures();
                scope.attr.mapscale = $svyGIS.getmap().getScale();
            });
        }
    };
}]);

_svyGIS.directive("tocbasemap", ["$sce", "$svyGIS", function ($sce, $svyGIS) {
    return {
        restrict: "E",
        templateUrl: "/comm/api/svylib/tpls/gisTOCbasemap.html?uuid=" + svyUUID(),
        scope: { "basemap": "=", "showdatasource":"=" },
        link: function (scope, element, attrs) {
            scope.attr = {
                basemaptitle: $sce.trustAsHtml(scope.basemap.title),
            }

            if (scope.showdatasource == null || scope.showdatasource == undefined) scope.showdatasource = false;

            scope.alter = function (basemap) {
                $svyGIS.alterbasemap(basemap);
            }
        }
    };
}]);

_svyGIS.directive("tocfeature", ["$sce", "$svyGIS", function ($sce, $svyGIS) {
    return {
        restrict: "E",
        templateUrl: "/comm/api/svylib/tpls/gisTOCfeature.html?uuid=" + svyUUID(),
        scope: { "feature": "=", "showdatasource": "=" },
        link: function (scope, element, attrs) {
            scope.attr = {
                featuretitle: $sce.trustAsHtml(scope.feature.title),
                mapscale: 200000,
                showtransparency: false
            }

            scope.$on("mapscalechanged", function (event, args) {
                scope.$apply(function () { scope.attr.mapscale = args.mapscale; });
            });

            scope.setvisible = function(){
                var _map = $svyGIS.getmap();
                _map.getLayer(scope.feature.layerid).setVisibility(scope.feature.visible = !scope.feature.visible);
                scope.feature.setvisible(scope.feature.visible);
            }
        }
    };
}]);

_svyGIS.directive("transparency", ["$svyGIS", function ($svyGIS) {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            element.slider({
                value: scope.$parent.feature.opacity,
                max: 1,
                min: 0,
                step: 0.1,
                change: function (event, ui) {
                    var _mapI = $svyGIS.getmap();
                    scope.$parent.feature.opacity = ui.value;
                    _mapI.getLayer(scope.$parent.feature.layerid).setOpacity(scope.$parent.feature.opacity);
                }
            });
        }
    };
}]);

////    Identify Components
_svyGIS.directive("identify", ["$svyGIS", function ($svyGIS) {
    return {
        restrict: "E",
        templateUrl: "/comm/api/svylib/tpls/gisIdentify.html?uuid=" + svyUUID(),
        scope: {},
        link: function (scope, element, attrs) {
            scope.attr = {
                on: false
            }

            scope.$parent.$root.$on("printstart", function (event) {
                var _mapI = $svyGIS.getmap();
                _mapI.setInfoWindowOnClick(scope.attr.on = false);
                _mapI.infoWindow.hide();
            });

            scope.start = function () {
                var _mapI = $svyGIS.getmap();
                _mapI.setInfoWindowOnClick(scope.attr.on = !scope.attr.on);
                if (!scope.attr.on) _mapI.infoWindow.hide();
            }
        }
    };
}]);

////    Advanced Print Components
_svyGIS.directive("printmap", ["$svyGIS", "$uibModal", function ($svyGIS, $uibModal) {
    return {
        restrict: "E",
        templateUrl: "/comm/api/svylib/tpls/gisPrintMap.html?uuid=" + svyUUID(),
        scope: { },
        link: function (scope, element, attrs) {
            scope.attr = {
                show: false,
                mdcontrol: null
            }

            scope.control = function () {
                if (scope.attr.show = !scope.attr.show) {
                    scope.$emit("printstart");
                    scope.attr.mdcontrol = $uibModal.open({
                        animation: true,
                        templateUrl: "/comm/api/svylib/tpls/gisPrintMapControl.html?uuid=" + svyUUID(),
                        windowClass: "svyprintmapcontrol",
                        windowTemplateUrl: "/comm/api/svylib/tpls/gisPrintMapWindow.html?uuid=" + svyUUID(),
                        controller: "printmapcontrol",
                        backdrop: false,
                        resolve: {
                            args: function () {
                                return { printtitle: attrs["printtitle"] }
                            }
                        }
                    });
                    scope.attr.mdcontrol.result.then(
                        function () { scope.attr.show = false; scope.attr.mdcontrol = null; },
                        function () { scope.attr.show = false; scope.attr.mdcontrol = null; }
                    );
                }
                else { if (scope.attr.mdcontrol != null) scope.attr.mdcontrol.dismiss(); }
            }
        }
    };
}]);

_svyGIS.controller("printmapcontrol", function ($scope, $uibModal, $uibModalInstance, $svyGIS, $svyDialog, args) {
    $scope.attr = {
        title: (args.printtitle) ? args.printtitle : "Survey Division GIS Platform",
        papertype: "papertype1",
        size: "A4",
        orientation: "Landscape",
        quality: "Low",
        scale: $svyGIS.getmap().getScale().toString(),
        printing: false,
        elapsedtime: 0,
        printtimer: null
    }

    $scope.$on("modal.closing", function () {
        var _mapI = $svyGIS.getmap();
        if (_mapI.getLayer("svyprintframe")) _mapI.getLayer("svyprintframe").clear();
    })

    $scope.$watch("attr.papertype", function (newValue, oldValue) {
        if (newValue == null || newValue == undefined) return;
        if (newValue == oldValue) return;
        switch (newValue) {
            case "papertype1": $scope.attr.size = "A4"; $scope.attr.orientation = "Landscape"; $scope.drawframe(); break;
            case "papertype2": $scope.attr.size = "A4"; $scope.attr.orientation = "Portrait"; $scope.drawframe(); break;
            case "papertype3": $scope.attr.size = "A3"; $scope.attr.orientation = "Landscape"; $scope.drawframe(); break;
            case "papertype4": $scope.attr.size = "A3"; $scope.attr.orientation = "Portrait"; $scope.drawframe(); break;
        }
    });

    $scope.$watch("attr.printing", function (newValue, oldValue) {
        if (newValue == null || newValue == undefined) return;
        if (newValue == oldValue) return;
        if (newValue == true) {
            $scope.attr.elapsedtime = 0;
            $scope.attr.printtimer = setInterval(function () { $scope.attr.elapsedtime++; }, 1000);
        }
        else { clearInterval($scope.attr.printtimer); }
    });

    $scope.drawframe = function () {
        var _mapI = $svyGIS.getmap();
        var _floatFrameWidth;
        var _floatFrameHeight;
        var _floatFrameCenterX;
        var _floatFrameCenterY;

        switch ($scope.attr.size) {
            case "A3":
                switch ($scope.attr.orientation) {
                    case "Landscape":
                        _floatFrameWidth = 0.408 * $scope.attr.scale;
                        _floatFrameHeight = 0.2405 * $scope.attr.scale;
                        break;

                    case "Portrait":
                        _floatFrameWidth = 0.284 * $scope.attr.scale;
                        _floatFrameHeight = 0.353 * $scope.attr.scale;
                        break;
                }
                break;

            case "A4":
                switch ($scope.attr.orientation) {
                    case "Landscape":
                        _floatFrameWidth = 0.29 * $scope.attr.scale;
                        _floatFrameHeight = 0.17 * $scope.attr.scale;
                        break;

                    case "Portrait":
                        _floatFrameWidth = 0.195 * $scope.attr.scale;
                        _floatFrameHeight = 0.244 * $scope.attr.scale;
                        break;
                }
                break;
        }

        require(
            [
                "esri/layers/GraphicsLayer",
                "esri/geometry/Polygon",
                "esri/geometry/Point",
                "esri/graphic",
                "esri/graphicsUtils",
                "esri/geometry/Extent",
                "esri/SpatialReference",
                "esri/toolbars/edit"
            ],
            function (GraphicsLayer, Polygon, Point, Graphic, graphicsUtils, Extent, SpatialReference, Edit) {
                var _frameEdit = new Edit(_mapI);

                var _glPrintMapFrame = _mapI.getLayer("svyprintframe");
                if (_glPrintMapFrame == null || _glPrintMapFrame == undefined) _glPrintMapFrame = _mapI.addLayer(new GraphicsLayer({ id: "svyprintframe" }));

                if (_glPrintMapFrame.graphics.length == 0) {
                    _floatFrameCenterX = _mapI.extent.getCenter().x;
                    _floatFrameCenterY = _mapI.extent.getCenter().y;
                }
                else {
                    var _oCenter = graphicsUtils.graphicsExtent(_glPrintMapFrame.graphics).getCenter();
                    _floatFrameCenterX = _oCenter.x;
                    _floatFrameCenterY = _oCenter.y;
                }

                _glPrintMapFrame.clear();
                var _polygonPrintFrame = new Polygon([
                    [_floatFrameCenterX - (_floatFrameWidth / 2), _floatFrameCenterY - (_floatFrameHeight / 2)],
                    [_floatFrameCenterX - (_floatFrameWidth / 2), _floatFrameCenterY + (_floatFrameHeight / 2)],
                    [_floatFrameCenterX + (_floatFrameWidth / 2), _floatFrameCenterY + (_floatFrameHeight / 2)],
                    [_floatFrameCenterX + (_floatFrameWidth / 2), _floatFrameCenterY - (_floatFrameHeight / 2)],
                    [_floatFrameCenterX - (_floatFrameWidth / 2), _floatFrameCenterY - (_floatFrameHeight / 2)]
                ]);
                _polygonPrintFrame.setSpatialReference(new SpatialReference(2326));

                var _gPrintFrameJSON = {
                    geometry: _polygonPrintFrame,
                    symbol: {
                        type: "esriSFS",
                        style: "esriSFSSolid",
                        color: [255, 0, 0, 40],
                        outline: { "color": [255, 0, 0, 255], "width": 2, "type": "esriSLS", "style": "esriSLSDash" }
                    }
                };

                _glPrintMapFrame.add(new Graphic(_gPrintFrameJSON));

                _frameEdit.activate(Edit.MOVE, _glPrintMapFrame.graphics[0]);
            }
        );
    }

    $scope.print = function () {
        $scope.attr.printing = true;
        require(
            ["esri/tasks/PrintTask", "esri/tasks/PrintTemplate", "esri/graphicsUtils"],
            function (PrintTask, PrintTemplate, graphicsUtils) {
                var _mapI = $svyGIS.getmap();
                var _glPrintFrameLayer = _mapI.getLayer("svyprintframe");

                if (_glPrintFrameLayer == null || _glPrintFrameLayer == undefined) return;

                _glPrintFrameLayer.visible = false;

                var printTask = new PrintTask();
                var printTemplate = new PrintTemplate();
                var _ExportWebMap = printTask._getPrintDefinition(_mapI, printTemplate);

                _ExportWebMap.mapOptions.extent = graphicsUtils.graphicsExtent(_glPrintFrameLayer.graphics);
                _ExportWebMap.mapOptions.scale = $scope.attr.scale;

                var _oParams = {
                    title: $scope.attr.title,
                    webmap: JSON.stringify(_ExportWebMap),
                    orientation: $scope.attr.orientation,
                    size: $scope.attr.size,
                    type: "PDF",
                    resolution: $scope.attr.quality,
                    f: "pjson"
                }

                _glPrintFrameLayer.visible = true;

                $svyGIS.wscall(
                    "advancedprint",
                    _oParams,
                    function (response) {
                        var _oPrintStatus = response;
                        if (_oPrintStatus.jobStatus == "esriJobSubmitted") {
                            function _ftnIteratePrintStatus(response) {
                                $svyGIS.wscall(
                                    "checkprintstatus",
                                    { jobid: _oPrintStatus.jobId, f: "pjson" },
                                    function (response) {
                                        switch (response.jobStatus) {
                                            case "esriJobSucceeded":
                                                $svyGIS.wscall(
                                                    "getprintresult",
                                                    { jobid: response.jobId },
                                                    function (response) {
                                                        $scope.attr.printing = false;
                                                        window.open(response.value.url, "_blank");
                                                    },
                                                    function (err) {
                                                        $svyDialog("error", "SPRS Message", "ArcGIS Server Error", "Print Job Failed");
                                                        $scope.attr.printing = false;
                                                    }
                                                );
                                                break;

                                            case "esriJobFailed":
                                                $svyDialog("error", "SPRS Message", "ArcGIS Server Error", "Print Job Failed");
                                                $scope.attr.printing = false;
                                                break;

                                            default:
                                                setTimeout(_ftnIteratePrintStatus(response), 1000);
                                                break;
                                        }
                                    },
                                    function (err) {
                                        $svyDialog("error", "SPRS Message", "Critical Error", err.message);
                                        $scope.attr.printing = false;
                                    },
                                    null,
                                    true
                                );
                            }

                            setTimeout(_ftnIteratePrintStatus(response), 1000);
                        }
                    },
                    function (err) {
                        $svyDialog("error", "SPRS Message", "Critical Error", err.message);
                        $scope.attr.printing = false;
                    },
                    null,
                    true
                );
            }
        );
    }

    $scope.close = function () { $scope.$emit("printend"); $uibModalInstance.dismiss(); }

    $scope.drawframe();
});

////    Spatial Search Components
_svyGIS.directive("svyspatialsearch", ["$svyGIS", "$svyDialog", function ($svyGIS, $svyDialog) {
    return {
        restrict: "E",
        templateUrl: "/comm/api/svylib/tpls/gisSSinput.html?uuid=" + svyUUID(),
        scope: {},
        link: function (scope, element, attrs) {
            function _ftnClearSearch() {
                var _mapI = $svyGIS.getmap();
                if (_mapI) {
                    if (_mapI.getLayer("svyssresult")) {
                        _mapI.getLayer("svyssresult").clear();
                        _mapI.infoWindow.hide();
                    }
                }

                scope.attr.searchcriteria = null;
                scope.attr.searchcancelled = true;
                scope.attr.searching = {};
                scope.attr.results = new Array();
                scope.attr.showresult = false;
            }

            scope.attr = {
                searchcriteria: null,
                searchcancelled: false,
                searching: {},
                showresult: false,
                results: new Array()
            }

            scope.$watch("attr.searchcriteria", function (newValue, oldValue) {
                if (newValue == null || newValue == undefined) { _ftnClearSearch(); return };
                if (newValue.trim().length < 3) return;

                scope.attr.searchcancelled = false;
                scope.attr.searching = { "background": "#ffffff url(/comm/api/svylib/images/misc/ajax-loader.gif) 5% 50% no-repeat" };
                $svyGIS.wscall(
                    "spatialsearch",
                    {
                        st: scope.attr.searchcriteria,
                        mr: 10,
                        bb: null,
                        so: false,
                        em: false,
                        l: null,
                        f: "pjson"
                    },
                    function (wsreturn) {
                        if (!scope.attr.searchcancelled) {
                            scope.attr.searching = {};
                            scope.attr.results = wsreturn.results;
                            if (scope.attr.results.length != 0) scope.attr.showresult = true;
                            else scope.attr.showresult = false;
                        }
                    }
                );
            });

            scope.clear = function () { _ftnClearSearch(); }

            scope.gosresult = function (result) {
                require(
                    ["esri/layers/GraphicsLayer", "esri/graphic", "esri/InfoTemplate", "esri/geometry/Point", "esri/geometry/Polygon", "esri/tasks/GeometryService"],
                    function (GraphicsLayer, Graphic, InfoTemplate, Point, Polygon, GeometryService) {
                        var _gResultJSON = {
                            geometry: result.geometry,
                            attributes: result.attributes,
                            symbol: null
                        };

                        switch (result.geometryType) {
                            case "esriGeometryPolygon":
                                _gResultJSON.symbol = {
                                    type: "esriSFS",
                                    style: "esriSFSSolid",
                                    color: [255, 255, 0, 70],
                                    outline: { "color": [255, 0, 0, 255], "width": 2, "type": "esriSLS", "style": "esriSLSSolid" }
                                }
                                break;

                            case "esriGeometryPolyline":
                                _gResultJSON.symbol = { "color": [255, 0, 0, 255], "width": 2, "type": "esriSLS", "style": "esriSLSSolid" };
                                break;

                            case "esriGeometryPoint":
                                _gResultJSON.symbol = {
                                    type: "esriSMS",
                                    style: "esriSMSCircle",
                                    color: [255, 0, 0, 255],
                                    size: 8,
                                    angle: 0,
                                    xoffset: 0,
                                    yoffset: 0
                                }
                                break;
                        }

                        var _htmlInfoContent = "<table class='table table-striped table-condensed' style='margin-bottom:0px;'>";
                        switch (result.layerName) {
                            case "LOT":
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Lot Code</td><td>" + ((result.attributes.LOTCODE) ? result.attributes.LOTCODE : "N/A") + "</td></tr>";
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Lot Number</td><td>" + ((result.attributes.LOTNUMBER) ? result.attributes.LOTNUMBER : "N/A") + "</td></tr>";
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Lot Number Alpha</td><td>" + ((result.attributes.LOTNUMBERALPHA) ? result.attributes.LOTNUMBERALPHA : "N/A") + "</td></tr>";
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Section Code</td><td>" + ((result.attributes.SECTIONCODE) ? result.attributes.SECTIONCODE : "N/A") + "</td></tr>";
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Lot Type</td><td>" + ((result.attributes.LOTTYPE) ? result.attributes.LOTTYPE : "N/A") + "</td></tr>";
                                break;

                            case "BUILDING":
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Building</td><td>" + result.attributes.ENGLISHBUILDINGNAME + " - " + result.attributes.CHINESEBUILDINGNAME + "</td></tr>";
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Street</td><td>" + result.attributes.ENGLISHSTREETNAME + " - " + result.attributes.CHINESESTREETNAME + "</td></tr>";
                                break;

                            case "SITE":
                            case "SUBSITE":
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Site ID</td><td>" + ((result.attributes.SITEID) ? result.attributes.SITEID : "N/A") + "</td></tr>";
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Site</td><td>" + result.attributes.ENGLISHSITENAME + " - " + result.attributes.CHINESESITENAME + "</td></tr>";
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Street</td><td>" + result.attributes.ENGLISHSTREETNAME + " - " + result.attributes.CHINESESTREETNAME + "</td></tr>";
                                break;

                            case "DISTRICT":
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>District</td><td>" + ((result.attributes.DISPLAYFIELD) ? result.attributes.DISPLAYFIELD : "N/A") + "</td></tr>";
                                break;

                            case "MAPINDEX":
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Index</td><td>" + ((result.attributes.DISPLAYFIELD) ? result.attributes.DISPLAYFIELD : "N/A") + "</td></tr>";
                                break;

                            case "UTILITY":
                                var _strStatus, _strType;
                                switch (result.attributes.STATUS) {
                                    case "E": _strStatus = "Existing"; break;
                                    case "P": _strStatus = "Proposed"; break;
                                    default: _strStatus = "N/A"; break;
                                }
                                switch (result.attributes.UTILITYPOINTTYPE) {
                                    case "EPO": _strType = "Electricity Pole"; break;
                                    case "ETP": _strType = "Electrical Transformer"; break;
                                    case "FWH": _strType = "Fresh Water Fire Hydrant"; break;
                                    case "LPO": _strType = "Lamp Post"; break;
                                    case "SWH": _strType = "Salt Water Fire Hydrant"; break;
                                    default: _strType = "UNKNOWN"; break;
                                }

                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Utility ID</td><td>" + ((result.attributes.DISPLAYFIELD) ? result.attributes.DISPLAYFIELD : "N/A") + "</td></tr>";
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Type</td><td>" + _strType + "</td></tr>";
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Status</td><td>" + _strStatus + "</td></tr>";
                                break;

                            case "ROAD":
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Road Name</td><td>" + ((result.attributes.DISPLAYFIELD) ? result.attributes.DISPLAYFIELD : "N/A") + "</td></tr>";
                                break;

                            case "SLOPE":
                                _htmlInfoContent += "<tr><td style='font-weight:bold;'>Slope No.</td><td>" + ((result.attributes.DISPLAYFIELD) ? result.attributes.DISPLAYFIELD : "N/A") + "</td></tr>";
                                break;
                        }
                        _htmlInfoContent += "</table>";
                        _gResultJSON.infoTemplate = { title: result.layerName, content: _htmlInfoContent };

                        var _mapI = $svyGIS.getmap();

                        var _glSearchResult = _mapI.getLayer("svyssresult");
                        if (_glSearchResult == null || _glSearchResult == undefined) _mapI.addLayer(new GraphicsLayer({ id: "svyssresult" }));
                        _mapI.getLayer("svyssresult").clear();
                        var _gResult = Graphic(_gResultJSON);
                        _mapI.getLayer("svyssresult").add(_gResult);
                        $svyGIS.zoomto(result.geometryType, _gResult, function () {
                            _mapI.infoWindow.setTitle(result.layerName);
                            _mapI.infoWindow.setContent(_htmlInfoContent);
                            switch (result.geometryType) {
                                case "esriGeometryPoint":
                                    _mapI.infoWindow.show(result.geometry);
                                    break;

                                case "esriGeometryPolyline":
                                    var _ptOfMiddle = new Point();
                                    var _ringMiddle = result.geometry.paths[0][parseInt(result.geometry.paths[0].length / 2)];
                                    _ptOfMiddle.x = _ringMiddle[0];
                                    _ptOfMiddle.y = _ringMiddle[1];
                                    _ptOfMiddle.spatialReference = result.geometry.spatialReference;
                                    _mapI.infoWindow.show(_ptOfMiddle);
                                    break;

                                case "esriGeometryPolygon":
                                    var gs = new GeometryService("http://cedd7846:6080/arcgis/rest/services/Utilities/Geometry/GeometryServer");
                                    var _pResult = new Polygon(result.geometry.spatialReference);
                                    _pResult.addRing(result.geometry.rings[0]);

                                    gs.labelPoints(
                                        [_pResult],
                                        function (labelPoints) {
                                            _mapI.infoWindow.show(labelPoints[0]);
                                        },
                                        function (err) {
                                            $svyDialog("error", "SPRS Message", "Critical Error", err.message + "<br/>" + err.details);
                                        }
                                    );

                                    break;
                            }
                        });
                    }
                );
            }
        }
    }
}])

_svyGIS.factory("$svyGIS", ["$rootScope", "$http", "$q", "$uibModal", "$filter", function ($rootScope, $http, $q, $uibModal, $filter) {
    ////    Classes
    function _mapp(oParam) {
        this.zoomlevel = (oParam) ? ((oParam.zoomlevel) ? oParam.zoomlevel : 0) : 0;
        this.center = (oParam) ? ((oParam.center) ? oParam.center : { x: 835000, y: 830000 }) : { x: 835000, y: 830000 };
        this.extent = null;
        this.initbasemap = (oParam) ? ((oParam.initbasemap) ? oParam.initbasemap : null) : null;
    }

    function _mapattr(oParam) {
        this.mapdiv = (oParam) ? ((oParam.mapdiv) ? oParam.mapdiv : "map") : "map";
        this.basemaps = (oParam) ? ((oParam.basemaps) ? oParam.basemaps : new Array()) : new Array();
        this.features = (oParam) ? ((oParam.features) ? oParam.features : new Array()) : new Array();
        this.graphics = (oParam) ? ((oParam.graphics) ? oParam.graphics : new Array()) : new Array();
        this.initp = (oParam) ? ((oParam.initp) ? oParam.initp : new _mapp()) : new _mapp();
        this.showdatasource = (oParam) ? ((oParam.showdatasource) ? oParam.showdatasource : new _mapp()) : new _mapp();
        this.prepared = false;
    }

    function _basemap(oParam) {
        this.path = (oParam) ? ((oParam.path) ? oParam.path : null) : null;
        this.id = (oParam) ? ((oParam.id) ? oParam.id : null) : null;
        this.title = (oParam) ? ((oParam.title) ? oParam.title : null) : null;
        this.datasource = (oParam) ? ((oParam.datasource) ? oParam.datasource : null) : null;
        this.bgcolor = (oParam) ? ((oParam.bgcolor) ? oParam.bgcolor : "white") : "white"
    }

    function _feature(oParam) {
        function _sublayer(oSLLParam, oRootFeature) {
            this.rootfeature = oRootFeature;
            var _booIsVisible = true;
            if (this.rootfeature) _booIsVisible = this.rootfeature.visible;

            this.id = (oSLLParam) ? ((oSLLParam.id != null) ? oSLLParam.id : null) : null;
            this.name = (oSLLParam) ? ((oSLLParam.name) ? oSLLParam.name : null) : null;
            this.scalerange =
                (oSLLParam) ?
                {
                    max: ((oSLLParam.maxScale) ? oSLLParam.maxScale : this.rootfeature.scalerange.max),
                    min: ((oSLLParam.minScale) ? oSLLParam.minScale : this.rootfeature.scalerange.min)
                } :
                { max: 0, min: 300000 };
            this.parentlayerid = (oSLLParam) ? ((oSLLParam.parentlayerid != null) ? oSLLParam.parentlayerid : null) : null;
            this.visible = { self: true, parent: this.rootfeature.visible, children: true };
            this.showlayer = false;
            this.sublayers = new Array();
            this.icondatas = new Array();

            this.addsublayer = function (oSLParam) {
                if (oSLParam.parentLayerId == this.id) this.sublayers.push(new _sublayer(oSLParam, this.rootfeature));
                else for (var i = 0; i < this.sublayers.length; i++) this.sublayers[i].addsublayer(oSLParam, this.rootfeature);
            }

            this.seticons = function (oLegend) {
                if (oLegend.layerId == this.id) {
                    for (var i = 0; i < oLegend.legend.length; i++)
                        this.icondatas.push("data:" + oLegend.legend[i].contentType + ";base64," + oLegend.legend[i].imageData);
                }
                else
                    for (var i = 0; i < this.sublayers.length; i++)
                        this.sublayers[i].seticons(oLegend);
            }

            this.setparentvisible = function (visible) {
                this.visible.parent = visible;
                for (var i = 0; i < this.sublayers.length; i++) this.sublayers[i].setparentvisible(visible && this.visible.self);
            }

            this.setvisible = function () {
                if (!this.visible.parent) return;
                this.visible.self = !this.visible.self;
                for (var i = 0; i < this.sublayers.length; i++) this.sublayers[i].setparentvisible(this.visible.self);
                this.rootfeature.updatevisible();
            }

            this.createvisible = function () {
                if (this.sublayers.length == 0) {
                    if (this.visible.self && this.visible.parent) this.rootfeature.visiblelayers.push(this.id);
                }
                else {
                    var _booChildren = true;
                    for (var i = 0; i < this.sublayers.length; i++) {
                        this.sublayers[i].createvisible();
                        if (!this.sublayers[i].visible.self || !this.sublayers[i].visible.children) { _booChildren = false; }
                    }
                    this.visible.children = _booChildren;

                    if (this.visible.self && this.visible.parent && _booChildren) this.rootfeature.visiblelayers.push(this.id);
                }
            }
        }

        this.id = -1;
        this.path = (oParam) ? ((oParam.path) ? oParam.path : null) : null;
        this.layerid = (oParam) ? ((oParam.layerid) ? oParam.layerid : null) : null;
        this.title = (oParam) ? ((oParam.title) ? oParam.title : null) : null;
        this.datasource = (oParam) ? ((oParam.datasource) ? oParam.datasource : null) : null;
        this.scalerange = (oParam) ? ((oParam.scalerange != null) ? oParam.scalerange : null) : null;
        this.visible = (oParam) ? ((oParam.visible !== null && oParam.visible !== undefined) ? oParam.visible : true) : true;
        this.opacity = (oParam) ? ((oParam.opacity != null) ? oParam.opacity : 1) : 1;
        this.showlayer = (oParam) ? ((oParam.showlayer != null) ? oParam.showlayer : false) : false;
        this.sublayers = new Array();
        this.icondatas = new Array();
        this.visiblelayers = (oParam) ? ((oParam.visiblelayers != null) ? oParam.visiblelayers : new Array()) : new Array();

        this.addsublayer = function (oSLParam) {
            if (oSLParam.parentLayerId == this.id) this.sublayers.push(new _sublayer(oSLParam, this));
            else for (var i = 0; i < this.sublayers.length; i++) this.sublayers[i].addsublayer(oSLParam ,this);
        }

        this.seticons = function (oLegend) {
            if (oLegend.layerId == this.id) {
                for (var i = 0; i < oLegend.legend.length; i++)
                    this.icondatas.push("data:" + oLegend.legend[i].contentType + ";base64," + oLegend.legend[i].imageData);
            }
            else
                for (var i = 0; i < this.sublayers.length; i++)
                    this.sublayers[i].seticons(oLegend);
        }

        this.setvisible = function (visible) {
            this.visible = visible;
            for (var i = 0; i < this.sublayers.length; i++) this.sublayers[i].setparentvisible(visible);
        }

        this.updatevisible = function () {
            this.visiblelayers = new Array();

            for (var i = 0; i < this.sublayers.length; i++) this.sublayers[i].createvisible();
            this.visiblelayers.sort(function (a, b) { return a - b });

            _map.getLayer(this.layerid).setVisibleLayers(this.visiblelayers);
        }
    }

    function _params(oArg) {
        this.mapelem = (oArg) ? ((oArg.mapelem) ? oArg.mapelem : "map") : "map";
        this.popupelem = (oArg) ? ((oArg.popupelem) ? oArg.popupelem : "pop") : "pop";
        this.scaleindicatorelem = (oArg) ? ((oArg.scaleindicatorelem) ? oArg.scaleindicatorelem : null) : null;
        this.coordinateindicatorelem = (oArg) ? ((oArg.coordinateindicatorelem) ? oArg.coordinateindicatorelem : null) : null;
        this.showinfoclick = (oArg) ? ((oArg.showinfoclick) ? oArg.showinfoclick : false) : false;
        this.zoomlevel = (oArg) ? ((oArg.zoomlevel) ? oArg.zoomlevel : 0) : 0;
        this.center = { x: 830500, y: 825400 };
        if (oArg) {
            if (oArg.center) {
                if (oArg.center.x) this.center.x = oArg.center.x;
                if (oArg.center.y) this.center.y = oArg.center.y;
                if (oArg.center.easting) this.center.x = oArg.center.easting;
                if (oArg.center.northing) this.center.y = oArg.center.northing;
            }
        }

        var _extentD;
        require(["esri/geometry/Extent"], function (Extent) {
            var _extentDefault = new Extent({
                xmin: 800000,
                ymin: 800000,
                xmax: 867500,
                ymax: 848000,
                spatialReference: { wkid: 102140 }
            });

            _extentD = (oArg) ? ((oArg.extent) ? new Extent(oArg.extent) : _extentDefault) : _extentDefault;
        });
        this.extent = _extentD;
        this.initbasemap = (oArg) ? ((oArg.initbasemap) ? oArg.initbasemap : null) : null;

        this.basemaps = (oArg) ? ((oArg.basemaps) ? oArg.basemaps : new Array()) : new Array();
        this.features = (oArg) ? ((oArg.features) ? oArg.features : new Array()) : new Array();
        this.graphics = (oArg) ? ((oArg.graphics) ? oArg.graphics : new Array()) : new Array();
    }

    var _svymap = function (oParam) {
        var _mapparams = new _params(oParam);
        var _thismap;

        require(
            [
                "esri/map",
                "esri/layers/ArcGISTiledMapServiceLayer",
                "esri/layers/ArcGISDynamicMapServiceLayer",
                "esri/layers/GraphicsLayer",
                "esri/dijit/Popup",
                "esri/InfoTemplate"
            ],
            function (
                Map,
                ArcGISTiledMapServiceLayer,
                ArcGISDynamicMapServiceLayer,
                GraphicsLayer,
                Popup,
                InfoTemplate
            ) {
                esriConfig.defaults.io.corsDetection = false;
                esriConfig.defaults.io.alwaysUseProxy = false;
                esriConfig.defaults.io.proxyUrl = "http://svy.cedd.hksarg/libs/ws/arcgisproxy/proxy.ashx";

                if (!angular.element("#" + _mapparams.popupelem).length) angular.element(document.body).append(angular.element("<div id='" + _mapparams.popupelem + "'></div>"));
                var _popup = new Popup(null, _mapparams.popupelem);
                _popup.visibleWhenEmpty = false;
                _popup.hideDelay = 0;

                _thismap = new Map(_mapparams.mapelem, {
                    extent: _mapparams.extent,
                    zoom: 0,
                    showAttribution: false,
                    logo: false,
                    infoWindow: _popup,
                    showInfoWindowOnClick: _mapparams.showinfoclick
                });
                _thismap.disableKeyboardNavigation();

                /////     Init Basemap
                if (!_mapparams.initbasemap && _mapparams.basemaps.length != 0) _mapparams.initbasemap = _mapparams.basemaps[0].id

                for (var i = 0; i < _mapparams.basemaps.length; i++) {
                    if (_mapparams.basemaps[i].id == _mapparams.initbasemap) {
                        _thismap.addLayer(new ArcGISTiledMapServiceLayer(_mapparams.basemaps[i].path, { id: _mapparams.basemaps[i].id }), 0);
                        angular.element("#" + _mapparams.mapelem).eq(0).css({ "background-color": _mapparams.basemaps[i].bgcolor });
                        break;
                    }
                }

                angular.forEach(_mapparams.features, function (fl) {
                    var _fl = _thismap.addLayer(new ArcGISDynamicMapServiceLayer(fl.path));
                    if (fl.initvisiablelayer) _fl.setVisibleLayers(fl.initvisiablelayer);
                });

                for (var i = 0; i < _mapparams.graphics.length; i++) _thismap.addLayer(new GraphicsLayer({ id: _mapparams.graphics[i] }));

                _thismap.on("load", function () {
                    angular.element(document.createElement("div"))
                        .addClass("esriSimpleSliderHomeButton")
                        .click(function () {
                            _thismap.setZoom(_mapparams.zoomlevel);
                            _thismap.centerAt(_mapparams.center);
                        })
                        .insertAfter(document.getElementsByClassName("esriSimpleSliderIncrementButton"));

                    _thismap.setZoom(_mapparams.zoomlevel);
                    _thismap.centerAt(_mapparams.center);

                    $rootScope.$broadcast("mapready");
                });

                _thismap.on("zoom-end", function () {
                    if (_mapparams.scaleindicatorelem) angular.element("#" + _mapparams.scaleindicatorelem).eq(0).html($filter("number")(_thismap.getScale(), 0));
                });

                _thismap.on("mouse-move", function (evt) {
                    if (_mapparams.coordinateindicatorelem) {
                        if (_mapparams.coordinateindicatorelem.northing) angular.element("#" + _mapparams.coordinateindicatorelem.northing).eq(0).html($filter("number")(evt.mapPoint.y, 0));
                        if (_mapparams.coordinateindicatorelem.easting) angular.element("#" + _mapparams.coordinateindicatorelem.easting).eq(0).html($filter("number")(evt.mapPoint.x, 0));
                    }
                });
            }
        );

        this.map = _thismap;
    }

    ////    Internal Variables
    var _map;
    var _intWSCallSeq = 0;
    var _attr = new _mapattr();

    ////    Map Functions
    function _ftnConfig(config) {
        if (config) {
            if (config.mapconfig) {
                if (config.mapconfig.center) _attr.initp.center = config.mapconfig.center;
                if (config.mapconfig.zoomlevel) _attr.initp.zoomlevel = config.mapconfig.zoomlevel;
                require(["esri/geometry/Extent"], function (Extent) {
                    if (config.mapconfig.extent) _attr.initp.extent = new Extent(config.mapconfig.extent);
                    else _attr.initp.extent = new Extent({
                        xmin: 800000,
                        ymin: 800000,
                        xmax: 867500,
                        ymax: 848000,
                        spatialReference: { wkid: 102140 }
                    });
                });
                if (config.mapconfig.initbasemap) _attr.initp.initbasemap = config.mapconfig.initbasemap;
            }
            else return false;

            if (config.basemaps) {
                for (var i = 0; i < config.basemaps.length; i++) _attr.basemaps.push(new _basemap(config.basemaps[i]));
            }
            else return false;

            if (config.features) {
                for (var i = 0; i < config.features.length; i++) _attr.features.push(new _feature(config.features[i]));
            }
            return true;
        }
        else return false;
    }

    function _ftnInit() {
        require(
            [
                "esri/map",
                "esri/layers/ArcGISTiledMapServiceLayer",
                "esri/layers/ArcGISDynamicMapServiceLayer",
                "esri/symbols/SimpleMarkerSymbol",
                "esri/dijit/Popup",
                "esri/InfoTemplate"
            ],
            function (Map, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer, SimpleMarkerSymbol, Popup, InfoTemplate) {
                esriConfig.defaults.io.corsDetection = false;
                esriConfig.defaults.io.proxyUrl = "http://svy.cedd.hksarg/comm/arcgisproxy/proxy.ashx";
                esriConfig.defaults.io.alwaysUseProxy = false;

                var _popup = new Popup(null, "pop");
                _popup.visibleWhenEmpty = false;
                _popup.hideDelay = 0;

                _map = new Map(_attr.mapdiv, {
                    extent: _attr.initp.extent,
                    zoom: 0,
                    showAttribution: false,
                    logo: false,
                    infoWindow: _popup
                });

                _map.setInfoWindowOnClick(false);

                for (var i = 0; i < _attr.basemaps.length; i++) {
                    if (_attr.basemaps[i].id == _attr.initp.initbasemap)
                        _map.addLayer(new ArcGISTiledMapServiceLayer(_attr.basemaps[i].path, { id: _attr.basemaps[i].id }), 0);
                }

                _map.on("load", function () {
                    angular.element(document.createElement("div"))
                        .addClass("esriSimpleSliderHomeButton")
                        .click(function () {
                            _map.setZoom(_attr.initp.zoomlevel);
                            _map.centerAt(_attr.initp.center);
                        })
                        .insertAfter(document.getElementsByClassName("esriSimpleSliderIncrementButton"));
                    _map.setZoom(_attr.initp.zoomlevel);
                    _map.centerAt(_attr.initp.center);

                    var _arrFeatureLayerInfosQuery = new Array();
                    for (var i = 0; i < _attr.features.length; i++) {
                        var _fd = new FormData();
                        _fd.append("f", "pjson");
                        _arrFeatureLayerInfosQuery.push(
                            $http.post(
                                _attr.features[i].path,
                                _fd,
                                {
                                    transformRequest: angular.identity,
                                    headers: { "Content-Type": undefined },
                                    xsrfHeaderName: i.toString()
                                }
                            )
                        );
                        _arrFeatureLayerInfosQuery.push(
                            $http.post(
                                _attr.features[i].path + "/legend",
                                _fd,
                                {
                                    transformRequest: angular.identity,
                                    headers: { "Content-Type": undefined },
                                    xsrfHeaderName: i.toString()
                                }
                            )
                        );
                    }
                    $q.all(_arrFeatureLayerInfosQuery).then(
                        function (results) {
                            for (var i = _attr.features.length - 1; i >= 0; i--) {
                                var _layerinfo = results[i * 2].data;

                                if (_attr.features[i].scalerange == null)
                                    _attr.features[i].scalerange = { min: _layerinfo.minScale, max: _layerinfo.maxScale };

                                if (_attr.features[i].showlayer) {
                                    var _booNeedToAdd = true;
                                    if (_attr.features[i].visiblelayers.length != 0) {
                                        var a = 1;
                                    }

                                    for (var j = 0; j < _layerinfo.layers.length; j++) {
                                        if (_attr.features[i].visiblelayers.length == 0 || _attr.features[i].visiblelayers.indexOf(_layerinfo.layers[j].id) != -1)
                                            _attr.features[i].addsublayer(_layerinfo.layers[j]);
                                    }

                                    var _legendinfo = results[(i * 2) + 1].data.layers;
                                    for (var j = 0; j < _legendinfo.length; j++) {
                                        if (_attr.features[i].visiblelayers.length == 0 || _attr.features[i].visiblelayers.indexOf(_legendinfo[j].layerId) != -1)
                                            _attr.features[i].seticons(_legendinfo[j]);
                                    }
                                }


                                var _fl = _map.addLayer(new ArcGISDynamicMapServiceLayer(_attr.features[i].path, { id: _attr.features[i].layerid }));

                                if (_attr.features[i].opacity != null) _fl.setOpacity(_attr.features[i].opacity);
                                if (_attr.features[i].visiblelayers.length != 0) _fl.setVisibleLayers(_attr.features[i].visiblelayers);
                                _fl.setScaleRange(_attr.features[i].scalerange.min, _attr.features[i].scalerange.max);
                                _fl.setVisibility(_attr.features[i].visible);

                                if (infotemplatecollection[_attr.features[i].layerid] != null) {
                                    var _oInfoTemplate = new Object();
                                    for (var j=0; j<infotemplatecollection[_attr.features[i].layerid].length; j++){
                                        _oInfoTemplate[infotemplatecollection[_attr.features[i].layerid][j].layer] = {
                                            infoTemplate: new InfoTemplate({ title: _attr.features[i].title, content: infotemplatecollection[_attr.features[i].layerid][j].content }),
                                            layerUrl: _attr.features[i].path + "/" + infotemplatecollection[_attr.features[i].layerid][j].layer.toString()
                                        }
                                    }
                                    _fl.setInfoTemplates(_oInfoTemplate);
                                }

                            }
                            setTimeout(function () {
                                _map.on("zoom-end", function (anchor, extent, level, zoomFactor) {
                                    $rootScope.$broadcast("mapscalechanged", { mapscale: _map.getScale() });
                                });
                                $rootScope.$broadcast("mapprepared", { mapscale: _map.getScale() });
                            }, 200);
                        },
                        function (errs) {
                            //$svyDialog("error", "SPRS Message", "System Error", "Error(s) has/have been occur while initial <strong>FEATURES</strong>, please contact Administrator for following up.")
                        }
                    );
                });
            }
        );
    }

    function _ftnAlterBasemap(basemap) {
        if (_map.layerIds[0] == basemap.id) return;
        require(
            ["esri/layers/ArcGISTiledMapServiceLayer"],
            function (ArcGISTiledMapServiceLayer) {
                _map.removeLayer(_map.getLayer(_map.layerIds[0]));
                _map.addLayer(new ArcGISTiledMapServiceLayer(
                    basemap.path,
                    { id: basemap.id }),
                    0
                );
                $rootScope.$broadcast("mapbasemapchanged", basemap);
            }
        );
    }

    function _ftnGetMap() { return _map; }

    function _ftnGetBasemaps() { return _attr.basemaps; }

    function _ftnGetFeatures() { return _attr.features; }

    function _ftnAddLayer(type, layerid, index) {
        require(
            [
                "esri/layers/ArcGISTiledMapServiceLayer",
                "esri/layers/ArcGISDynamicMapServiceLayer",
                "esri/layers/GraphicsLayer"
            ],
            function (ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer, GraphicsLayer) {
                switch (type) {
                    case "graphic":
                        if (index) _map.addLayer(new GraphicsLayer({ id: layerid }), index);
                        else _map.addLayer(new GraphicsLayer({ id: layerid }));
                        break;
                }
            }
        );
    }

    ////    Navigation Functions
    function _ftnZoomTo(geometrytype, graphic, callback) {
        require(
            ["esri/graphicsUtils"],
            function (graphicsUtils) {
                var _ftnUpdateEndTrigger = _map.on("update-end", function (anchor, extent, level, zoomFactor) {
                    if (callback) callback();
                    _ftnUpdateEndTrigger.remove();
                });

                if (geometrytype == "esriGeometryPoint") _map.centerAndZoom(graphic.geometry, 8);
                else _map.setExtent(graphicsUtils.graphicsExtent([graphic]), true);
            }
        );
    }

    function _ftnGetLayer(layerid) {
        return _map.getLayer(layerid);
    }

    ////    WS Functions
    function _ftnWSCall(op, params, success, fail, finish, isignorelegacy) {
        var _strWSHTML = {
            upload: "http://cedd7846:6080/arcgis/rest/services/GIS/Tools/GPServer/uploads/upload",
            spatialsearch: "http://cedd7846:6080/arcgis/rest/services/GIS/SpatialSearch/MapServer/exts/SpatialSearch/spatialsearch",
            spatialanalysis: "http://cedd7846:6080/arcgis/rest/services/GIS/Tools/GPServer/SpatialAnalysis/submitJob",
            checkspatialanalysisstatus: "http://cedd7846:6080/arcgis/rest/services/GIS/Tools/GPServer/SpatialAnalysis/jobs/" + params.jobid + "?f=pjson",
            getspatialanalysisresults: "http://cedd7846:6080/arcgis/rest/services/GIS/Tools/GPServer/SpatialAnalysis/jobs/" + params.jobid + "/results/output?f=pjson",
            advancedprint: "http://cedd7846:6080/arcgis/rest/services/GIS/Tools/GPServer/AdvancedPrint/submitJob",
            checkprintstatus: "http://cedd7846:6080/arcgis/rest/services/GIS/Tools/GPServer/AdvancedPrint/jobs/" + params.jobid,
            getprintresult: "http://cedd7846:6080/arcgis/rest/services/GIS/Tools/GPServer/AdvancedPrint/jobs/" + params.jobid + "/results/outFile?f=pjson",
            showgeometry: "http://cedd7846:6080/arcgis/rest/services/GIS/Tools/GPServer/ShowGeometry/submitJob"
        }

        var _booIsIgnoreLegacy = (isignorelegacy != null) ? isignorelegacy : false;

        if (!_booIsIgnoreLegacy) _intWSCallSeq++;
        $http.get(
            _strWSHTML[op],
            {
                withCredentials: true,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                params: params,
                xsrfHeaderName: _intWSCallSeq.toString()
            }
        )
            .then(
                function (response) {
                    if (!_booIsIgnoreLegacy) {
                        if (response.config.xsrfHeaderName != _intWSCallSeq.toString()) return;
                    }
                    if (success) success(response.data);
                },
                function (err) {
                    //$svyDialog("error", "SPRS Message", "Critical Error", err); if (fail) fail();
                }
            )
            .finally(function () { if (finish) finish(); });
    }

    return {
        svymap: _svymap,
        mapclass: {
            param: _params
        },
        config: _ftnConfig,
        init: _ftnInit,
        alterbasemap: _ftnAlterBasemap,
        getmap: _ftnGetMap,
        getbasemaps: _ftnGetBasemaps,
        getfeatures: _ftnGetFeatures,
        zoomto: _ftnZoomTo,
        addlayer: _ftnAddLayer,
        wscall: _ftnWSCall
    }
}]);