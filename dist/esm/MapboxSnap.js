var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import distance from '@turf/distance';
import { featureCollection, point as TPoint, lineString } from '@turf/helpers';
import { circle as TCircle } from '@turf/circle';
import { coordAll } from '@turf/meta';
import { polygonToLine } from '@turf/polygon-to-line';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import lineSegment from '@turf/line-segment';
import midpoint from '@turf/midpoint';
var MapboxSnap = /** @class */ (function () {
    function MapboxSnap(options) {
        var _a;
        this.status = (_a = options.status) !== null && _a !== void 0 ? _a : false;
        this.map = options.map;
        this.drawing = options.drawing;
        this.options = options.options;
        this.onSnapped = function (fc) {
            if (options.onSnapped !== undefined) {
                options.onSnapped(fc);
            }
        };
        this.features = {};
        this.snapStatus = false;
        this.snapCoords = [];
        this.radiusInMeters = 0;
        this.addRadiusCircleLayer();
        this.addEvents();
    }
    MapboxSnap.prototype.changeSnappedPoints = function () {
        var drawings = this.drawing.getAll();
        var arr = [];
        for (var i = 0; i < drawings.features.length; i++) {
            var feature = drawings.features[i];
            var id = feature['id'];
            if (this.features[id]) {
                var snapP = this.features[id].snapPoints;
                if (this.features['unknow'] !== undefined) {
                    var snapEx = this.features['unknow'].snapPoints;
                    snapP = __assign(__assign({}, snapP), snapEx);
                }
                var newFeature = this.doSnap(feature, snapP);
                arr.push(newFeature);
            }
            else {
                if (this.features['unknow'] !== undefined) {
                    var snapEx = this.features['unknow'].snapPoints;
                    var newFeature = this.doSnap(feature, snapEx);
                    arr.push(newFeature);
                }
                else {
                    arr.push(feature);
                }
            }
        }
        var fc = { type: 'FeatureCollection', features: arr };
        this.drawing.set(fc);
        if (this.onSnapped) {
            this.onSnapped(fc);
        }
    };
    MapboxSnap.prototype.isPointSnapped = function (p1, p2) {
        var dist = distance(TPoint(p1), TPoint(p2), { units: 'meters' });
        if (dist < this.radiusInMeters) {
            return true;
        }
        else {
            return false;
        }
    };
    MapboxSnap.prototype.doSnap = function (feature, snaps) {
        switch (feature.geometry.type) {
            case 'Point': {
                var ownCoords1 = feature.geometry.coordinates;
                for (var i in snaps) {
                    if (this.isPointSnapped(ownCoords1, snaps[i])) {
                        feature.geometry.coordinates = snaps[i];
                    }
                }
                break;
            }
            case 'Polygon': {
                var ownCoords3 = feature.geometry.coordinates;
                var newCoords = [];
                for (var r = 0; r < ownCoords3.length; r++) {
                    var ring = ownCoords3[r];
                    var arr = [];
                    for (var j = 0; j < ring.length; j++) {
                        var coord3 = ring[j];
                        var isOk = false;
                        for (var i in snaps) {
                            if (this.isPointSnapped(coord3, snaps[i])) {
                                isOk = true;
                                arr.push(snaps[i]);
                                break;
                            }
                        }
                        if (isOk == false) {
                            arr.push(coord3);
                        }
                    }
                    newCoords.push(arr);
                }
                feature.geometry.coordinates = newCoords;
                break;
            }
            case 'LineString': {
                var ownCoords2 = feature.geometry.coordinates;
                var arr = [];
                for (var j = 0; j < ownCoords2.length; j++) {
                    var coord = ownCoords2[j];
                    var isOk = false;
                    for (var i in snaps) {
                        if (this.isPointSnapped(coord, snaps[i])) {
                            isOk = true;
                            arr.push(snaps[i]);
                            break;
                        }
                    }
                    if (isOk == false) {
                        arr.push(coord);
                    }
                }
                feature.geometry.coordinates = arr;
            }
        }
        return feature;
    };
    MapboxSnap.prototype.getMe = function () {
        return this;
    };
    MapboxSnap.prototype.setStatus = function (s) {
        this.status = s;
    };
    MapboxSnap.prototype.setMapData = function (featureCollection) {
        var source = this.map.getSource('snap-helper-circle');
        if (source) {
            source.setData(featureCollection);
        }
    };
    MapboxSnap.prototype.snapToClosestPoint = function (e) {
        if (this.status) {
            var point = e.point;
            var lngLat = this.map.unproject(point);
            var pointAtRadius = [point.x + this.options.radius, point.y];
            var lngLatAtRadius = this.map.unproject(pointAtRadius);
            var radiusInMeters = distance(TPoint([lngLat.lng, lngLat.lat]), TPoint([lngLatAtRadius.lng, lngLatAtRadius.lat]), { units: 'meters' });
            this.radiusInMeters = radiusInMeters;
            var circle = false;
            var snappedPoint = this.getCloseFeatures(e, radiusInMeters);
            if (snappedPoint) {
                this.snapStatus = true;
                this.snapCoords = snappedPoint.coords;
                circle = TCircle(snappedPoint.coords, radiusInMeters, { steps: 64, units: 'meters', properties: { color: snappedPoint.color } });
            }
            else {
                this.snapStatus = false;
                this.snapCoords = [];
            }
            var circleGeoJSON = featureCollection(circle == false ? [] : [circle]);
            this.setMapData(circleGeoJSON);
        }
    };
    MapboxSnap.prototype.addEvents = function () {
        var _this = this;
        this.map.on('mousemove', function (e) {
            _this.snapToClosestPoint(e);
        });
        this.map.on('draw.delete', function (e) {
            setTimeout(function () {
                _this.changeSnappedPoints();
            }, 100);
        });
        this.map.on('draw.update', function (e) {
            setTimeout(function () {
                _this.changeSnappedPoints();
            }, 100);
        });
        this.map.on('draw.create', function (e) {
            setTimeout(function () {
                _this.changeSnappedPoints();
            }, 100);
        });
        this.map.on('draw.selectionchange', function (e) {
            if (e.features.length > 0) {
                _this.status = true;
            }
            else {
                _this.status = false;
                _this.setMapData(featureCollection([]));
            }
        });
        this.map.on('draw.modechange', function (e) {
            _this.status = true;
            if (e.mode == 'simple_select') {
                _this.status = false;
            }
        });
        this.map.on('draw.render', function (e) {
            var source = _this.map.getSource('mapbox-gl-draw-hot');
            if (source) {
                var data = source._data;
                if (_this.snapStatus) {
                    var coord = [_this.snapCoords[0], _this.snapCoords[1]];
                    if (data.features.length > 0) {
                        data.features[0].geometry.coordinates = coord;
                    }
                }
            }
        });
        this.map.on('mouseup', function () {
            _this.drawingSnapCheck();
        });
        this.map.on('click', function () {
            _this.drawingSnapCheck();
        });
    };
    MapboxSnap.prototype.drawingSnapCheck = function () {
        if (this.snapStatus) {
            var source = this.map.getSource('mapbox-gl-draw-hot');
            var coord = [this.snapCoords[0], this.snapCoords[1]];
            var lng = coord[0].toFixed(6);
            var lat = coord[1].toFixed(6);
            var points = {};
            points["".concat(lng, "_").concat(lat)] = coord;
            if (source) {
                var data = source._data;
                if (data.features.length > 0) {
                    var f = data.features.find(function (a) { return a.properties.meta == 'feature'; });
                    if (f) {
                        var id = f.properties['id'];
                        if (!this.features[id]) {
                            this.features[id] = {
                                id: id,
                                snapPoints: points
                            };
                        }
                        else {
                            this.features[id].snapPoints["".concat(lng, "_").concat(lat)] = coord;
                        }
                    }
                }
                else {
                    if (!this.features['unknow']) {
                        this.features['unknow'] = {
                            id: id,
                            snapPoints: points
                        };
                    }
                    else {
                        this.features['unknow'].snapPoints["".concat(lng, "_").concat(lat)] = coord;
                    }
                }
            }
        }
    };
    MapboxSnap.prototype.searchInVertex = function (feature, mouse, radius) {
        var allCords = coordAll(feature);
        var closest = [];
        allCords.map(function (coords) {
            var dist = distance(TPoint(coords), TPoint([mouse.lng, mouse.lat]), { units: 'meters' });
            if (dist < radius) {
                closest.push({ coords: coords, dist: dist, color: '#8bc34a' });
            }
        });
        if (closest.length > 0) {
            closest.sort(function (a, b) { return a.dist - b.dist; });
            return closest[0];
        }
    };
    MapboxSnap.prototype.getLines = function (feature, mouse, radius) {
        var lines = [];
        switch (feature.geometry.type) {
            case 'LineString': {
                lines.push(feature);
                break;
            }
            case 'MultiLineString': {
                feature.geometry.coodinates.map(function (c) {
                    lines.push(lineString(c));
                });
                break;
            }
            case 'Polygon': {
                var line = polygonToLine(feature.geometry);
                lines.push(line);
                break;
            }
            case 'MultiPolygon': {
                var mlines = polygonToLine(feature.geometry);
                mlines.coodinates.map(function (c) {
                    lines.push(lineString(c));
                });
                break;
            }
        }
        return lines;
    };
    MapboxSnap.prototype.searchInMidPoint = function (feature, mouse, radius) {
        var lines = this.getLines(feature, mouse, radius);
        var segments = [];
        lines.map(function (line) {
            segments = segments.concat(lineSegment(line).features);
        });
        var closest = [];
        segments.map(function (seg) {
            var midPoint = midpoint(seg.geometry.coordinates[0], seg.geometry.coordinates[1]);
            var dist = distance(midPoint, TPoint([mouse.lng, mouse.lat]), { units: 'meters' });
            if (dist < radius) {
                closest.push({ coords: midPoint.geometry.coordinates, dist: dist, color: '#03a9f4' });
            }
        });
        if (closest.length > 0) {
            closest.sort(function (a, b) { return a.dist - b.dist; });
            return closest[0];
        }
    };
    MapboxSnap.prototype.searchInEdge = function (feature, mouse, radius) {
        var lines = this.getLines(feature, mouse, radius);
        var closest = [];
        for (var i = 0; i < lines.length; i++) {
            var p = nearestPointOnLine(lines[i], TPoint([mouse.lng, mouse.lat]), { units: 'meters' });
            if (p.properties['dist'] !== undefined) {
                if (p.properties.dist < radius) {
                    closest.push({ coords: p.geometry.coordinates, dist: p.properties.dist, color: '#ff9800' });
                }
            }
        }
        if (closest.length > 0) {
            closest.sort(function (a, b) { return a.dist - b.dist; });
            return closest[0];
        }
    };
    MapboxSnap.prototype.getCloseFeatures = function (e, radiusInMeters) {
        var features = this.map.queryRenderedFeatures(e.point, {
            layers: this.options.layers,
        });
        if (features.length > 0) {
            var snappedPoint;
            var isSnapped = false;
            for (var i = 0; i < features.length; i++) {
                var mostClose = features[i];
                var rules = this.options.rules;
                var mouseCoord = e.lngLat;
                isSnapped = false;
                if (rules.indexOf('vertex') !== -1 && snappedPoint == undefined) {
                    snappedPoint = this.searchInVertex(mostClose, mouseCoord, radiusInMeters);
                    if (snappedPoint) {
                        isSnapped = true;
                        break;
                    }
                }
                if (rules.indexOf('midpoint') !== -1 && snappedPoint == undefined) {
                    snappedPoint = this.searchInMidPoint(mostClose, mouseCoord, radiusInMeters);
                    if (snappedPoint) {
                        isSnapped = true;
                        break;
                    }
                }
                if (rules.indexOf('edge') !== -1 && snappedPoint == undefined) {
                    snappedPoint = this.searchInEdge(mostClose, mouseCoord, radiusInMeters);
                    if (snappedPoint) {
                        isSnapped = true;
                        break;
                    }
                }
            }
            if (isSnapped) {
                return snappedPoint;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    };
    MapboxSnap.prototype.addRadiusCircleLayer = function () {
        this.map.addSource('snap-helper-circle', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        this.map.addLayer({
            id: "snap-helper-circle",
            type: 'fill',
            source: "snap-helper-circle",
            paint: {
                'fill-color': ['get', 'color'],
                'fill-opacity': 0.6,
            },
        });
    };
    return MapboxSnap;
}());
export default MapboxSnap;
//# sourceMappingURL=MapboxSnap.js.map