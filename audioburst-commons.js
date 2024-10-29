window.Audioburst = {
	commons: {}
};

with (window.Audioburst.commons) window.Audioburst.commons={
	$: jQuery,
	ajax: wp.ajax,
	element: window.wp.element,
	el: window.wp.element.createElement,
	isDefined: function (x) {
		return typeof x != 'undefined';
	},
	isUndefined: function (x) {
		return typeof x == 'undefined';
	},
	is: function (x) {
		return typeof x != 'undefined' && x;
	},
	isObject: function (x) {
		return x != null && (typeof x) == 'object';
	},
	isString: function (x) {
		return x != null && (typeof x) == 'string';
	},
	isEmptyString: function (obj) {
		return this.isString(obj) && obj.length == 0;
	},
	isArray: function (obj) {
		return this.isObject(obj) && (obj.constructor == Array);
	},
	isEmpty: function (obj) {
		return !((this.isArray(obj) || this.isString(obj)) && obj.length > 0);
	},
	isInteger: function (v) {
		return parseInt(v).toString() === (v).toString();
	},
	withDefault: function (v, dv) {
		return this.isDefined(v) ? v : dv;
	},
	ifEmptyOrUndefined: function (v, dv) {
		return this.isDefined(v) && v != null && !this.isEmptyString(v) ? v : dv;
	},
	isEmptyOrUndefined: function (v) {
		return !(this.isDefined(v) && v != null && !this.isEmptyString(v));
	},
	xSafe: function (op, dv) {
		try {
			return op();
		} catch (z) {
		}
		return dv;
	},
	isIntString: function (s) {
		try {
			return /^\d+$/.test(s);
		} catch (z) { }
		return false;
	},
	isDebugable: location.toString().includes('://localhost:'),
	clog: function () {
		try {
			if (this.isDebugable) console.log.apply(null, arguments);
		} catch (x) {
			console.log('clogError:'+x);
		}
	},
	fetchBurstsByStationId: function(stationId, setBurstList) {
		this.ajax.send({
			url: 'https://sapi.audioburst.com/v2/topstories/search?q=*&top=25&device=web&appKey=CrowdTask&filter=stationId+eq+' + stationId,
			type: 'GET',
			crossDomain: true
		})
			.always(data => {
				if (this.isDefined(data) && !this.isEmpty(data.bursts)) {
					//clog('data.bursts='); clog(data);
					let lst = [
						{ value: null, label: 'Choose a story ...' }
					];
					for (let burst of data.bursts) {
						lst.push({
							label: burst.title,
							value: burst.burstId
						});
					}
					setBurstList(lst);
				} else
					setBurstList([]);
			});
   }
};

class AudioburstToggleSwitcher extends React.Component {
	constructor(props) {
		super(props);
	}

	fixLook() {
		let q = jQuery(ReactDOM.findDOMNode(this));
		let ck = q.find(':checked');

		q.find("span.components-form-toggle__thumb")
			.css("background-color", ck.length ? '#000000' : '')
			;

		q.find('span.components-form-toggle__track')
			.css("background-color", ck.length ? '#ffffff' : '')
			.css('border-color', ck.length ? '#000000' : '')
			.css('border-width', ck.length ? '1px' : '')
			;
	}

	componentDidMount() {
		this.fixLook();
	}

	render() {
		this.fixLook();
		return wp.element.createElement(wp.components.FormToggle, this.props);
	}
}

