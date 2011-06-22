/*
 * Vector rendering for all browsers that support canvas.
 */

L.Browser.canvas = (function() {
	return !!document.createElement('canvas').getContext;
})();

L.Path = (L.Path.SVG && !window.L_PREFER_CANVAS) || !L.Browser.canvas ? L.Path : L.Path.extend({
	statics: {
		//CLIP_PADDING: 0.02, // not sure if there's a need to set it to a small value
		CANVAS: true,
		SVG: false
	},
	
	options: {
		updateOnMoveEnd: true
	},
	
	_initElements: function() {
		this._initRoot();
	},
	
	_initRoot: function() {
		var root = this._map._pathRoot;
		
		if (!root) {
			root = this._map._pathRoot = document.createElement("canvas");
			this._map._panes.overlayPane.appendChild(root);

			this._map.on('moveend', this._updateCanvasViewport, this);
			this._updateCanvasViewport();
		}
		
		this._ctx = root.getContext('2d');
	},
		
	_updateStyle: function() {
		this._ctx.lineCap = "round";
		this._ctx.lineJoin = "round";

		if (this.options.stroke) {
			this._ctx.lineWidth = this.options.weight;
			this._ctx.strokeStyle = this.options.color;
		}
		if (this.options.fill) {
			this._ctx.fillStyle = this.options.fillColor || this.options.color;
		}
	},
	
	_drawPath: function() {	
		var i, j, len, len2, point, drawMethod;
		
		this._ctx.beginPath();

		for (i = 0, len = this._parts.length; i < len; i++) {
			for (j = 0, len2 = this._parts[i].length; j < len2; j++) {
				point = this._parts[i][j];
				drawMethod = (j === 0 ? 'move' : 'line') + 'To';
				
				this._ctx[drawMethod](point.x, point.y);
			}
			// TODO refactor ugly hack
			if (this instanceof L.Polygon) {
				this._ctx.closePath();
			}
		}
	},
	
	_updatePath: function() {
		this._drawPath();
		
		this._updateStyle();
		
		if (this.options.fill) {
			this._ctx.globalAlpha = this.options.fillOpacity;
			this._ctx.fill();	
		}
		
		if (this.options.stroke) {
			this._ctx.globalAlpha = this.options.opacity;
			this._ctx.stroke();
		}
		
		/*
		 * TODO not sure if possible to implement, but a great optimization would be to do 
		 * 1 fill/stroke for all features with equal style instead of 1 for each feature 
		 */
	},

	_updateCanvasViewport: function() {
		this._updateViewport();
		
		var vp = this._map._pathViewport,
			min = vp.min,
			size = vp.max.subtract(min),
			root = this._map._pathRoot;
	
		//TODO check if it's works properly on mobile webkit
		L.DomUtil.setPosition(root, min);
		root.width = size.x;
		root.height = size.y;
		root.getContext('2d').translate(-min.x, -min.y);
	},
		
	_initEvents: function() {
		if (this.options.clickable) {
			// TODO hand cursor
			// TODO mouseover, mouseout, dblclick 
			this._map.on('click', this._onClick, this);
		}
	},
	
	_onClick: function(e) {
		if (this._containsPoint(e.layerPoint)) {
			this.fire('click', e);
		}
	}
});