with (window.Audioburst.commons) (function (blocks) {

	const iconEl=el(
		"svg", {
			x: "0px",
			y: "0px",
			viewBox: "0 0 52 53"
		},
		el("circle", {
		  fill:"#E60685", 	
		  cx: "26.1",
		  cy: "26.5",
		  r: "24.7"
		}),
		el("circle", {
		  fill:"#FFFFFF", 	
		  cx: "26.1",
		  cy: "26.5",
		  r: "22.7"
		}),
		el("path", {
		  fill:"#E60685", 	
		  d: "M36,38.1h-4.5v-2.8h-0.1c-1.5,2.1-4.4,3.4-7,3.4c-3.2,0-5.8-1.3-7.6-3.4     c-1.6-2-2.6-4.6-2.6-7.5c0-2.8,0.7-5.2,2.6-7.3c2.1-2.4,4.6-3.5,7.6-3.5c2.8,0,5.3,1.3,6.9,3.5v-2.9H36V38.1z M25.4,21.8     c-3.6,0-6.2,2.7-6.2,6.3c0,3.4,2.7,5.9,6.1,5.9c3.6,0,6-2.6,6-6.1C31.3,24.4,28.9,21.7,25.4,21.8z"
		}) 
	);

	class SmarterSet extends Set {
		isEmpty() {
			return this.size == 0;
		}
		clone() {
		   let cs = new SmarterSet();
		   this.forEach(e => cs.add(e));
		   return cs;
		};
		filter(f) {
			let cs = new SmarterSet();
			this.forEach(e => {
				if (f(e)) cs.add(e);
			});
			return cs;
		};
	};
	

	var playlistSelectors = new SmarterSet();


	function fetchRequiredNodesAndRefreshSelectors(afterThat) {
		fetchRequiredTreeNodes(
			(nodesLeft) => {
				clog("nodesLeft=" + nodesLeft);
			//	if (nodesLeft == 0) {
					playlistSelectors.forEach(s => s.refresh());
			//	}
				if (isDefined(afterThat)) afterThat();
			}
		);
	}

	function getItemName(props) {
		let playlist = props.attributes.playlist,
			playlistLabel = props.attributes.playlistName,
			burstId = props.attributes.burstId,
			burstName = props.attributes.burstName
			;
		clog(['props', props]);

		if (is(burstId)) {
			clog("is(burstId): " + burstName);
			if (isDefined(burstName)) return __(burstName);
		} else {
			if (isDefined(playlistLabel)) return __list(playlistLabel);
		}

		let rec = anyRecById(playlist);
		if (
			isDefined(rec) &&
			isDefined(rec.text)) return rec.title;//(rec.isLeaf ? __(burstName) : __list(rec.text));

		return playlist;
	}

	function ifr(props, fDesign, deptions) {

		let mode = props.attributes.mode,
			creatorMode = withDefault(props.attributes.creatorMode, false),
			mh = withDefault(props.attributes.minHeight, minHeight(mode, props.attributes.modeSpec)),
			mw = withDefault(props.attributes.minWidth, minWidth(mode, true)),
			width = withDefault(props.attributes.width, mw),
			height = withDefault(props.attributes.height, mh),
			align = withDefault(props.attributes.align, 'center'),
			playlist = props.attributes.playlist,
			stationId = props.attributes.stationId,
			burstId = props.attributes[creatorMode ? "cmBurstId" : "burstId"],
			autoplay = withDefault(props.attributes.autoplay, false),
			singleBurst =
				withDefault(props.attributes.singleBurst, false),
			cmPlayAllBursts =
				withDefault(props.attributes.cmPlayAllBursts, false),
			cmSameSource =
				withDefault(props.attributes.cmSameSource, false),
			theme=props.attributes.theme
			;

		clog('ifr.a', props.attributes);
		clog('ifr.minHeight=', props.attributes.minHeight, mh, minHeight(mode));


		clog("ifr height:" + height + " cmPlayAllBursts=" + cmPlayAllBursts);

		let style = {
			align: align,
			'min-height': mh + 'px',
			height: height + 'px',
			width: width + 'px',
			overflow: 'hidden',
			'max-height': height + 'px',
			'min-width': mw + 'px'
		};

		if (align == 'full') {
			style.align = 'center';
			style.width = '100%';
			style['max-width'] = '100%';
		} else {
			style['max-width'] = width + 'px';
		}

		let sbm = creatorMode ?!cmPlayAllBursts: singleBurst;

		clog('creatorMode=' + creatorMode +" sbm="+sbm);

		let action, value;
		if (creatorMode) {
			if (sbm) {
				action = cmSameSource ? 'same_source' : 'related_bursts';
				value = burstId;
			} else {
				action = "s_playlist"
				value = stationId; /*5843,13719*/
			}
		} else {
			action = sbm ? 'related_bursts' : 'channel';
			value = sbm ? burstId : playlist;
		}

		let url = 'https://embed.audioburst.com/?source=audioburst';

		if (!(creatorMode && (cmSameSource || cmPlayAllBursts)) 
			||
			xSafe(()=>deptions.alwaysIncludeAutoplay)
		) url += '&autoplay=' + autoplay;

		url+=
			'&action=' + action +
			'&mode=' + mode +
			'&value=' + value
			;


		if (theme) url += '&theme='+theme;

		clog("url = " , url);

		return el(
			'iframe',
			{
				style: style,
				scrolling: 'no',
				frameborder: 'no',
				src: url,
				allow: "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
			}
		);
	};	 

	function fetchPlayerVariants() {
		ajax.send({
			url: 'https://sapi.audioburst.com/Embeddable/get?appKey=WPPlugin',
			type: 'GET',
			crossDomain: true
		})
		.always(json => xSafe(
			() => {
				if (json.length) {
					let lst = json
						.filter(e => e.Active && e.IntegrationType == "js")
						.map(e => {
							return {
								value: e.Key,
								label: e.Description,
								mh:    e.MinHeight,
								themes : e.Themes
							};
						});
					clog("fetchedList", lst);
					if (!isEmpty(lst)) lst.forEach(e => {
						let j = modes.find(x => x.value == e.value);
						if (j) {
							/*
							for (let i in e)
								if (isDefined(e[i])) j[i] = e[i]; 
								*/
							j.label = e.label;
							j.themes = e.themes;
						} else
							modes.push(e);
					});
					clog("updatedList", modes);
				}
			}
		));	
	}


	function fetchPlaylists(doAfterThat) {
		ajax.send({
			url: 'https://sapi.audioburst.com/static/api/mobileHomeSettings_V07/json',
			type: 'GET',
			crossDomain: true
		})
		.always(res => {
			doAfterThat(res);
		});			
	}

	var theTree = [], modes = [
/*
Players new names and new order:
2 buttons player - Highlights player
iTunes player - Highlights player 2
2 state player - Publishers player
Ab2 player - Playlist player light mode
AB1 player  - Playlist player dark mode
L shape - Podcasters player
Classic Maxi Player
Classic Mini Player
Classic Midi Player
===============================*/
		{ value: "2b", label: "2 Buttons Player", mh: 287, mw: 400, omw: 600 },
		{ value: "it", label: "iTunes Player", mh: 287, mw: 600, omw: 600 },
		{ value: "2s", label: "2 State Player", mh: 252, mw: 400, omw: 600 },
		{ value: "ab2", label: "ab2 Player", mh: 274, mw: 600, omw: 600, themes: ["light", "dark"] },
		{ value: "ab1", label: "ab1 Player", mh: 274, mw: 600, omw: 600, themes: ["dark", "light"] },
		{ value: "ls", label: "L Shape Player", mh: 324, mw: 400, omw: 600 },
		{ value: 'maxi', label: 'Maxi', mw: 600, omw: 600, mh: 200, themes: ["light", "dark"]},
		{ value: 'mini', label: 'Mini', mw: 200, omw: 600, mh: 50, themes: ["light", "dark"] },
		{ value: 'midi', label: 'Midi', mw: 600, omw: 600, mh: 100, themes: ["light", "dark"]}
	];

	function modeThemes(mode) {
		let mt = xSafe(() => modes.find(ae => ae.value == mode).themes);
		if (!isEmpty(mt)) return mt.map(v => { return { label: v, value: v }; });
		return undefined;
	}

	function calcModeSpec(mode) {
		return xSafe(() => modes.find(ae => ae.value == mode));
	}
	
	function minWidth(mode, fOmw) {
		return withDefault(
			xSafe(
				() => modes.find(ae => ae.value == mode)[fOmw?'omw':'mw'],
				{  mini: 200,
				   midi: 600,
				   maxi: 600
				}[mode]
			), 300
		);
	}

	function minHeight(mode, modeSpec) {
		let md = calcModeSpec(mode);
		//clog("calcModeSpec(mode, modeSpec).md", md)
		if (isUndefined(md)) md = modeSpec;
		if (md && md.mh) return md.mh; 

		return withDefault( 
			 xSafe(
				() => ({   mini: 50,
					midi: 100,
					maxi: 200
				}[mode])
			),
			200
		);
	}
	

	var playlistsToFetch = new SmarterSet();


	function plNameToId(name) {
		for (let sec of theTree) for (let p of sec.children) {
			if (p.abData.name == name) return p.value;
		}
		return name;
	}


	function playlistRecByKey(key) {
		for (let sec of theTree)
			for (let p of sec.children) {
				if (p.key == key) return p;
			}
		return undefined;
	}

	function sectionKey(id) {
		for (let sec of theTree) for (let p of sec.children) {
			if (p.value == id) return sec.key;
			if (!isEmpty(p.children)) {
				for (let b of p.children)
					if (b.value == id) return sec.key;
			}
		}
		return undefined;
	}

	function anyRecByKey(key, tree) {
		if (!isDefined(tree)) tree = theTree;
		for (let n of tree) {
			if (n.key == key) return n;
			if (!isEmpty(n.children)) {
				let k = anyRecByKey(key, n.children);
				if (isDefined(k)) {
					clog(['anyRecByKey:', k]);
					return k;
				} 
			}
		}
		return undefined;
	}

	function key2val(key) {
		if (isDefined(key.key)) key = key.key;
		let rec = anyRecByKey(key);
		clog(rec);
		return isDefined(rec) ? rec.value : undefined;
	}

	function anyRecById(id) {
		for (let sec of theTree) for (let p of sec.children)  {
			if (p.key == id) return p;
			if (!isEmpty(p.children)) {
				for (let b of p.children)
					if (b.key == id) return b;
			}
		}
		return undefined;
	}

	var lastClicked, scrollAterRefresh;

	$(document).click(function (e) {
		e = e || event;
		lastClicked = $(e.target || e.srcElement);
		if (lastClicked.hasClass('audioburst-rc-tree-select-tree-switcher')) {
			let div = lastClicked.closest('div');
			let list = div.closest('.audioburst-rc-tree-select-tree-list');
			scrollAterRefresh = {
				list: list,
				sY: list.scrollTop(),
				div: div,
				divOffset: function () {
					let scrollable = this.list.children(0);
					return this.div.offset().top - scrollable.offset().top;
				},
				scrollTop: function () {
					return this.list.scrollTop();
				}
			};
			scrollAterRefresh.viewPortY = scrollAterRefresh.divOffset();
		} else
			scrollAterRefresh = undefined;
	});

	function burstRecById(id) {
		for (let s of theTree)
			for (let p of s.children) 
				 for (let b of p.children)
					 if (b.value == id) return b;
					
		return undefined;
	}

	class Resizable extends React.Component {
		constructor(props) {
			super(props);
			this.blockProps = props.blockProps;
		} 

		componentDidMount() {
			$(ReactDOM.findDOMNode(this)).find('.components-resizable-box__handle')
				.css('display', 'block');
			this.updateTheLookAccordingSelection();

		}

		updateTheLookAccordingSelection() {
			let rb = $(ReactDOM.findDOMNode(this))
				.find('.components-resizable-box__handle');

			if (this.props.blockProps.isSelected) {
				rb.css('filter', '');
			} else {
				rb.css('filter', 'grayscale()');
			}
		}


		componentDidUpdate() {
			this.updateTheLookAccordingSelection();
		}
 
		render() {
			return el(
				wp.components.ResizableBox,
				{

					style: {
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						border: "solid 1px #ddd",
						background: "#f0f0f0"
					},

					size: {
						width: this.props.width,
						height: this.props.height,
					},

					enable: {
						top: true,
						right: true,
						bottom: true,
						left: true,
						topRight: true,
						bottomRight: true,
						bottomLeft: true,
						topLeft: true
					},
					minHeight: this.props.mh,
					minWidth: this.props.mw,
					onResizeStart: () => {
						this.blockProps.toggleSelection(false);
					},
					onResizeStop: (event, direction, elt, delta) => {
						this.blockProps.setAttributes({
							height: this.props.height + delta.height,
							width: this.props.width + delta.width,
						});
					}
				},
				this.props.content
			);
		}
	};

	class TheTreeControl extends React.Component {
		constructor(props) {
			super(props);
			let playlist = props.blockProps.attributes.playlist;

			if (playlist && !isInteger(playlist)) {
				playlist = plNameToId(playlist);
				if (!playlist) alert("!!!!!!")
			}

			let burstId = props.blockProps.attributes.burstId,
			    itemLabel = getItemName(props.blockProps),
			    selectedItemId = is(burstId) ? burstId : playlist,
			    sKey = withDefault(props.blockProps.attributes.section, sectionKey(playlist)),
			    pKey = playlistKey(sKey, playlist);

			this.expKeys = is(burstId) ? [pKey] : [];
			if (sKey) this.expKeys.unshift(sKey);

			clog("expKeys:" + JSON.stringify(this.expKeys, null, 1));
			clog("selectedItemId:" + selectedItemId);

			this.blockProps = props.blockProps;

			this.state = {
				value: selectedItemId,
				label: itemLabel,
				tree: theTree
			};
		}

		fixScrollPosition() {
			if (scrollAterRefresh) {
				clog('fixScrollPosition ');
				// fix scrooll position
				let oldPos = scrollAterRefresh.viewPortY - scrollAterRefresh.sY;
				let doff = scrollAterRefresh.divOffset();
				let sTop = scrollAterRefresh.scrollTop();
				let newPos = doff - sTop;

				let lh = scrollAterRefresh.list.height(),
					dh = scrollAterRefresh.div.height(),
					delta = lh - dh
					;

				clog(lh+" "+dh);

				if (oldPos != newPos && (newPos > delta || newPos<0)) {
					clog(oldPos + "!=" + newPos);
					scrollAterRefresh.list.scrollTop(sTop + (newPos - oldPos));
				}
			}
		}

		refresh() {
			this.setState({ tree: theTree.slice() });
			this.fixScrollPosition();
            scrollAterRefresh = null;
		}

		componentWillUnmount() {
			playlistSelectors.delete(this);
		}

		fixTheStyles() {
			let q = $(ReactDOM.findDOMNode(this));

			q.find(".audioburst-rc-tree-select-selector")
				.css("border-radius", "3px")
				.css("overflow", "hidden");

			q.find(".audioburst-rc-tree-select-selection-item")
				.css("white-space", "nowrap")
				.css("overflow", "hidden")
				.css("text-overflow", "ellipsis")
				.css("width", "calc(100% - 30px)")
				.css("padding-left", "7px")
				;	
		}


		componentDidMount() {
			playlistSelectors.add(this);
			this.fixTheStyles();
		}
	
		render() {
			let selector = el(
				AudioburstTreeSelect,
				{
					className: 'components-select-control__input',
					prefixCls: 'audioburst-rc-tree-select',
					style: {
						width: "100%",
					},
					dropdownPopupAlign: {
						points: ['tr', 'br']
					},
					dropdownStyle: {
						'border-radius': '2px',
						'min-width': '25%',
						'max-width': '90%'
					},
					showSearch: true,
					allowClear: true,
					//	treeLine: true,
					//	treeIcon: true,
					treeDefaultExpandedKeys: this.expKeys,
					treeNodeFilterProp: "text",
					filterTreeNode: true,
					dropdownMatchSelectWidth: false,
					labelInValue: true,
					treeData: this.state.tree,
					value: this.state,
					onDropdownVisibleChange: (visible, info) => {
						if (!visible) this.fixTheStyles();
					},
					onTreeExpand: expKeysNow => {
						clog(expKeysNow);
						setTimeout(
							() => this.fixScrollPosition(),
							200
						);
					},
					onSelect: (id, rec) => {
						let key = rec.key;
						clog("onSelect: " + key + " " + id);
						rec = anyRecByKey(key);
						if (!rec.isLeaf) {
							clog("onPlaylistSelect: " + rec);
							this.setState({ value: id, label: rec.title });
							this.blockProps.setAttributes({
								playlistName: rec.text,
								playlist: id,
								section: rec.parentId,
								burstId: false,
								burstName: false,
								singleBurst: false
							});
						} else {
							clog("onBurstSelect: ", rec);			
							this.setState({ value: id, label: rec.title })
							this.blockProps.setAttributes({
								playlistName: false,
								playlist: rec.parentId,
								section: rec.section,
								burstName: rec.text,
								burstId: id,
								singleBurst: true
							});
						}
						clog(id, rec.text, rec);
						//clog(JSON.stringify(this.blockProps.attributes,null,1));
						clog(['b-props', this.blockProps]);
						
					},
					loadData: treeNode => {
						if (!isEmpty(treeNode.children)) {
							return new Promise(resolve => resolve());
						}

						let icEl;

						if (/*lastClicked && lastClicked.length > 0*/false) {
							for (let re = lastClicked; ;) {
								icEl = re.find('span.audioburst-rc-tree-select-tree-iconEle');
								if (icEl.length > 0) break;
								re = re.parent();
								if (re.length == 0) {
									icEl = false;
									break;
								}
							} 
							if (false) {
								let cnt = 10;
								for (let re = lastClicked;
									cnt-- && re.length > 0;
									re = re.parent()) {
									console.log(re);
								}
							}	
						}


						if (icEl) {
							clog(icEl);
							icEl.append($("<img src='data:image/gif;base64,R0lGODlhEAAQAKIGAMLY8YSx5HOm4Mjc88/g9Ofw+v///wAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFCgAGACwAAAAAEAAQAAADMGi6RbUwGjKIXCAA016PgRBElAVlG/RdLOO0X9nK61W39qvqiwz5Ls/rRqrggsdkAgAh+QQFCgAGACwCAAAABwAFAAADD2hqELAmiFBIYY4MAutdCQAh+QQFCgAGACwGAAAABwAFAAADD1hU1kaDOKMYCGAGEeYFCQAh+QQFCgAGACwKAAIABQAHAAADEFhUZjSkKdZqBQG0IELDQAIAIfkEBQoABgAsCgAGAAUABwAAAxBoVlRKgyjmlAIBqCDCzUoCACH5BAUKAAYALAYACgAHAAUAAAMPaGpFtYYMAgJgLogA610JACH5BAUKAAYALAIACgAHAAUAAAMPCAHWFiI4o1ghZZJB5i0JACH5BAUKAAYALAAABgAFAAcAAAMQCAFmIaEp1motpDQySMNFAgA7'>"));
						}


						return new Promise(
							resolve => {
								let rec = playlistRecByKey(treeNode.key);
								if (isDefined(rec) && isDefined(rec.abData) && isDefined(rec.abData.APIcall)) {
									playlistsToFetch.add(treeNode.key);
									clog("sheduled to fetsh: " + treeNode.key);
									fetchRequiredNodesAndRefreshSelectors(
										() => {
											resolve();
											clog("resolve: " + treeNode.key);
											if (icEl) icEl.html('');
										}
									);
								}
							}
						);
					}
				}
			);
			return el(
				wp.components.BaseControl,
				{ label: "Choose a story/topic" },
				selector
			);
		}
		
	}

	var perBlockSlots = {};

	var theAttributes = {
		creatorMode: {
			type: 'boolean',
			def: true
			},
		cmPlayAllBursts: {
			type: 'boolean',
			def: false
			},
		cmSameSource: {
			type: 'boolean',
			def: false
			},
		stationId: {
			type: 'integer',
			def: 19251
		},
		section: {
			type: 'string',
			def: undefined
		},
		theme: {
			type: 'string',
			def: undefined
		},
		playlist: {
			type: 'string',
			def: 'Top Stories'
			},
		playlistName: {
			type: 'string',
			def: undefined
		},
		cmBurstId: {
			type: 'string',
			def: undefined
		},
		burstId: {
			type: 'string',
			def: undefined
		},
		burstName: {
			type: 'string',
			def: undefined
		},
		mode: {
			type: 'string',
			def: '2b'
			},
		modeSpec: {
			type: 'object',
			def: undefined
		},
		width: {
			type: 'integer',
			def: 400
			},
		minHeight: {
			type: 'integer',
			def: undefined
		},
		minWidth: {
			type: 'integer',
			def: undefined
		},
		height: {
			type: 'integer',
			def: 200
			},
		singleBurst: {
			type: 'boolean',
			def: false
			},
		autoplay: {
			type: 'boolean',
			def: false
		},
		compatLelel: {
			type: 'integer',
			def: undefined
		},
		align: {
			// left, center, right, wide, full
			/*
			 * The .alignfull option should span the full width of the screen. 
			 * I typically do this using the following CSS:
			.alignfull {
				margin: 32px calc(50% - 50vw);
				max-width: 100vw;
				width: 100vw;
			}
			 */
			type: 'string',
			def: 'center'
			},
	};

	var defaults = {};
	
	for (let a in theAttributes) try {
		let v = theAttributes[a].def;
		theAttributes[a]['default'] = v;
		defaults[a] = v;
		delete theAttributes[a].def;
	} catch (z) { }
	
	clog('defaults=', defaults);
	clog('theAttributes=', theAttributes);


	function attrWithDefault(attrs, name, verbose) {
		let v = attrs[name];
		let r = isDefined(v) ? v : defaults[name];
		if (verbose) {
			clog('attrWithDefault', attrs, name, isDefined(v), defaults[name], r);
		}
		return r;
	}

	var theSupports = {
		align: ['left', 'center', 'right', 'full']
	};

	var exampleAttributes = {
		creatorMode: false,
		playlist: 'Top Stories',
		mode: '2b',
		init() {
			this.minWidth = minWidth(this.mode);
			this.minHeight = minHeight(this.mode);
			return this;
		}
	}.init();	

	function fixCompatLevel(props) {
	}
	
	blocks.registerBlockType('audoburst/player', {
		title: 'Audioburst Podcast Highlights Player',
		icon: iconEl,
		category: 'embed',
		supports: theSupports,
		
		example: {
			attributes: exampleAttributes
		},
		
		attributes: theAttributes, 
		edit: function (props) {

			function aVal(name, verbose) {
				return attrWithDefault(props.attributes, name, verbose);
			}

			let playlist = props.attributes.playlist,
				burstId = props.attributes.burstId,
				cmBurstId = props.attributes.cmBurstId,

				mode = props.attributes.mode,
				themes = modeThemes(mode),
				theme = props.attributes.theme,
				mh =  minHeight(mode, props.attributes.modeSpec),
				mw = minWidth(mode),
				width = withDefault(props.attributes.width, mw),
				height = withDefault(props.attributes.height, mh),
				align = withDefault(props.attributes.align, 'center'),
				autoplay = withDefault(props.attributes.autoplay, false),
				creatorMode = aVal('creatorMode', true);//withDefault(props.attributes.creatorMode, false),
			    stationId = aVal('stationId'),
				blockId = props.clientId,
				cmPlayAllBursts = aVal('cmPlayAllBursts'),
				cmSameSource = aVal('cmSameSource')
			;

			clog('cmPlayAllBursts=', cmPlayAllBursts);
				

			if (!perBlockSlots[blockId]) perBlockSlots[blockId] = {};

			if (!isDefined(props.attributes.minHeight)) {
				props.setAttributes({
					minHeight: minHeight(mode, props.attributes.modeSpec)
				});
			}

			let [isAutoplayChecked, setAutoplayChecked] = element.useState(autoplay);
			let [getStationId, setStationId] = element.useState(stationId);
			let [getBurstList, setBurstList] = element.useState([]);


			if (is(burstId)) {
				let b = burstRecById(burstId);
				if (!isDefined(b)) {
					playlistsToFetch.add(playlist);
					fetchRequiredNodesAndRefreshSelectors();
				}
			}

			clog('!!!!creatorMode=', creatorMode);

			let inspectorControlsArgsArray = [
				'div',
				{
					id: "gbs-block-inspected-inspector-control-wrapper",
					style: {
						'padding-left': '10px',
						'padding-right': '10px',
						'margin-bottom': 0
					}
				},
				'Add short-form talk-audio to your blog or website. Highlight your own podcast or enrich blog post with bursts of relevant short-form audio content.',
				el('p'),
			
				el(
					wp.components.BaseControl,
					{},
					el('label', {
						className: "components-toggle-control__label",
						style: {
							"padding-right": '10px'
						}
					}, "By show"),
					el(
						AudioburstToggleSwitcher,
						{
							checked: !creatorMode,
							onChange: () => {
								props.setAttributes({ creatorMode: !creatorMode });
							}
						}
                    ),
					el('label', {
						className: "components-toggle-control__label",
						style: {
							"padding-left": '10px'
						}
					}, "By topic")
				)
			];


			function fetchCreatorModeStoryList(stationId/*5843,13719*/) {

				clog(stationId);
				clog(getBurstList);


				if (stationId) {
					fetchBurstsByStationId(stationId, setBurstList);
				} else
					setBurstList([]);
			}

			function rqfetchCreatorModeStoryList(stationId) {
				clog("rqfetchCreatorModeStoryList 1");
				xSafe(() => clearTimeout(perBlockSlots[blockId].timer));
				perBlockSlots[blockId].timer = setTimeout(
					() => {
						clog("rqfetchCreatorModeStoryList 2");
						fetchCreatorModeStoryList(stationId);
					},
					700
				);
			}

			if (creatorMode) {
				let anyStationContent = !isEmpty(getBurstList);

				clog('anyStationContent=' + anyStationContent);
				//clog(getBurstList);

				if (isDefined(getStationId) && !anyStationContent) {
					rqfetchCreatorModeStoryList(getStationId);
				}


				let stIdReactControl = el(
					wp.components.TextControl,
					{
						label: el(
							'div',
							{},
							'Station ID (',
							el('a', { href: 'https://creators.audioburst.com/?utm_source=WP&utm_medium=plugin&utm_campaign=plugin', target: '_blank' }, 'grab your own content'),
							')'
						),
						value: isDefined(getStationId) ? getStationId : '',
						onChange: function (newValue) {
							newValue = newValue.trim();
							if (newValue=='' || isIntString(newValue)) {
								props.setAttributes({ stationId: parseInt(newValue) });
								setStationId(newValue);
								rqfetchCreatorModeStoryList(newValue);
							}
						}
					}
				);

				inspectorControlsArgsArray.push(
					stIdReactControl
				);

				if (anyStationContent) {
					inspectorControlsArgsArray.push(
						el(
							wp.components.CheckboxControl,
							{
								label: "Play all",
								checked: cmPlayAllBursts,
								onChange: ch => {
									props.setAttributes({ cmPlayAllBursts: ch });
								}
							}
						)
					);
					if (!cmPlayAllBursts) {
						inspectorControlsArgsArray.push(
							el(
								wp.components.SelectControl,
								{
									label: "Choose a story",
									style: {
										"text-overflow": "ellipsis"
									},
									value: cmBurstId,
									options: getBurstList,
									onChange: newValue => {
										props.setAttributes({
											cmBurstId: newValue
										});
									}
								}
							),
							el(
								wp.components.CheckboxControl,
								{
									label: "Next bursts from the same show",
									checked: cmSameSource,
									onChange: ch => {
										props.setAttributes({
											cmSameSource: ch
										});
									}
								}
							)
						  );
					}
				}
			} else inspectorControlsArgsArray.push(
				el(TheTreeControl, { blockProps: props })
            );
			inspectorControlsArgsArray.push(
				el(
					wp.components.SelectControl,
					{
						label: 'Look and Feel',
						value: mode,
						options: modes,
						onChange: newValue => {
							let mode = newValue,
							    mh = minHeight(mode),
								mw = minWidth(mode),
								modeSpec = calcModeSpec(mode)
								,

						     	ats = {
									mode: mode,
									modeSpec: modeSpec,
									minHeight: mh,
									minWidth: mw,
									height: Math.max(height, mh),
									width: Math.max(width, mw)
							    };

							if (isEmpty(modeSpec.themes)) {
								ats.theme = undefined;
							} else if (isUndefined(theme)) {
								ats.theme = modeSpec.themes[0];
							}


							props.setAttributes(ats);
						}
					}
				)
			);
			if (!isEmpty(themes)) {
				clog('themes=', themes);
				inspectorControlsArgsArray.push(
					el(
						wp.components.SelectControl,
						{
							label: 'Theme',
							value: theme,
							options: themes,
							onChange: newValue => {
								props.setAttributes({ theme: newValue });
							}
						}
					)
				);
			}

			inspectorControlsArgsArray.push(
				el(
					wp.components.CheckboxControl,
					{
						label: 'Enable automatic play',
						checked: isAutoplayChecked,
						onChange: ch => {
							autoplay = ch;
							props.setAttributes({ autoplay: ch });
							setAutoplayChecked(ch);
						}
					}
				)
			); 

			return [
				el(
					wp.blockEditor.InspectorControls,
					{},
					el.apply(null, inspectorControlsArgsArray)
				),
				(align !== 'full'
					//&& (props.isSelected || props.isSelectionEnabled)
				)
					? el(
						Resizable,
						{
							width: width,
							height: height,
							mh: mh,
							mw: mw,
							blockProps: props,
							content: ifr(props, true, { alwaysIncludeAutoplay: true })
						}
					)
					: ifr(props, true, { alwaysIncludeAutoplay: true })
			];
		},
		save: function (props) {
			return ifr(props, false, { alwaysIncludeAutoplay: true });
		},
		deprecated: [
			{
				attributes: theAttributes, 
				supports: theSupports,
				
				migrate: function (attributes) {
					if (isUndefined(attributes.compatLelel)) {
						let creatorMode = withDefault(attributes.creatorMode, false),
							cmPlayAllBursts = withDefault(attributes.cmPlayAllBursts, false),
							cmSameSource = withDefault(attributes.cmSameSource, false)
						;
						if (creatorMode && (cmSameSource || cmPlayAllBursts)) {
							attributes.autoplay = true;	
							attributes.compatLelel = 1;
							clog('migrateDataFixed=', attributes);
						}
					}
					return attributes;
			    },
				save: function (props) {
					clog('deprecated');
					return ifr(props, false, { alwaysIncludeAutoplay: false });
				}
			}
        ]
	});

	function fetchBurstsIfNeed(cbk, parentNode) {
		if (isEmpty(parentNode.children)) {
			ajax.send({
				url: parentNode.abData.APIcall + '&appKey=WPPLugin&userId=CrowdTask',
				type: 'GET',
				crossDomain: true
			})
			.always(data => {
				cbk(isDefined(data.bursts) ? data : undefined);
			});
		} else
			cbk();
	}

/*
 .rc-tree-node-selected {
    background-color: #ffe6b0;
    border: 1px #ffb951 solid;
    opacity: 0.8;
  }
 */

	function __(x) {
		return el('span', {
			style: {
				'text-decoration': 'underline',
				'font-family': 'Condensed, sans-serif',
				'line-height': '8px'
		//		'vertical-align': 'text-top'
			//	'font-family': 'Montserrat, sans-serif'
			}
		}, x); 
	}

	function __list(x) {
		return el('span', {
			style: {
				'text-decoration': 'underline',
				'font-family': 'Montserrat, sans-serif'
			}
		}, x);
	}

	function __sec(x) {
		return el('span', {
			style: {
				'cursor': 'default',
				'font-weight': 'bold',
				'font-family': 'Montserrat, sans-serif'
			}
		}, x);
	}

	function fetchBurstsAndPopulate(afterThat, parentNode) {
		fetchBurstsIfNeed(jso => {
			if (isDefined(jso)) {
				if (!isEmpty(jso.bursts) && isEmpty(parentNode.children)) jso.bursts.forEach(
					b => { 
						parentNode.children.push(
							{
								key: b.burstId,
								value: b.burstId,
								parentId: parentNode.value,
								title: __(b.title),
								text: b.title,
								isLeaf: true,
								selectable: true,
								section: parentNode.parentId,
								abData: b
							}
						);				
					}
				);
			}
			if (isDefined(afterThat)) afterThat();
		}, parentNode);
	}

	var after_fetchRequiredTreeNodes = new SmarterSet(),
		is_fetchRequiredTreeNodes_Working = false;

	function fetchRequiredTreeNodes(afterThat) {
		//console.log("000: " + after_fetchRequiredTreeNodes);

		if (isDefined(afterThat)) {
			after_fetchRequiredTreeNodes.add(afterThat);
			if (is_fetchRequiredTreeNodes_Working) return;
		} 

		is_fetchRequiredTreeNodes_Working = true;

		//console.log(111 + " " + is_fetchRequiredTreeNodes_Working);

		let pmss = [], playlistsToFetchSnapshot = playlistsToFetch.clone();
		
		for (let sec of theTree) for (let node of sec.children)
			if (playlistsToFetch.has(node.key)) {
				if (isEmpty(node.children)) {
					pmss.push(
						new Promise(
							done => {
								fetchBurstsAndPopulate(done, node);
							}
						)
					);
				} else
					playlistsToFetch.delete(node.key)
			} 
		
		Promise.all(pmss).then(
			() => {
				let newKeys =
					playlistsToFetch.filter(x => !playlistsToFetchSnapshot.has(x))
					;
				if (!newKeys.isEmpty()) {
					fetchRequiredTreeNodes();
				} else {
					let cs = after_fetchRequiredTreeNodes.clone();

					/*console.log(2222 + " " +
						after_fetchRequiredTreeNodes.size
						+ " " + cs.size
					);*/
					let left = after_fetchRequiredTreeNodes.size;
					after_fetchRequiredTreeNodes.clear();
					cs.forEach(
						f => {
							//console.log(3333)
							f(--left);
						} 
					);
					is_fetchRequiredTreeNodes_Working = false;
				}
			}
		);
	}

	function playlistKey(section, name) {
		return section + "|-" + name;
	}

	fetchPlayerVariants();
	// prefetch
	fetchPlaylists((json) => {
		for (let i = 0; i < json.sections.length; i++) {
			let sec = json.sections[i];
			if ((sec.title !== 'My Feed') &&
				(sec.title != "My Playlists") &&
				(sec.index>1) &&
				(sec.items.length > 0
					&& (sec.items.length > 1 || sec.items[0].name !== 'For You'))
			) {

				let sKey = '#section#/'+sec.index;
				let section = {
					key: sKey,
					value: sKey,
					title: __sec(sec.title),
					text: sec.title,
					selectable: false,
					children: [],
					add: function (pl) {
						pl.key = playlistKey(this.key, pl.value);
						//pl.sec = this;
						this.children.push(pl);
					}
				};

				theTree.push(section);

				for (let j = 0; j < sec.items.length; j++) {
					let item = sec.items[j];
					if (item.active && isDefined(item.DisplayName)) {
						item.DisplayName = item.DisplayName.trim();
						if (item.DisplayName.length == 0) {
							item.DisplayName = item.name;
							//console.log(item.name + " => " + item.DisplayName);
						}
						let v = item.name;
						let pid = item.playlistId;
						if (!isEmptyOrUndefined(pid)) {
							let dup = false;
							for (let pl of sec.items)
								if (pid == pl.playlistId && pl != item) {
								dup = true; break;
							} 
							if (!dup) v = pid;
						}
						section.add(
							{
								text: item.DisplayName,
								value: v, //ifEmptyOrUndefined(item.playlistId, item.name),
								title: __list(item.DisplayName),
								abData: item,
								parentId: section.key,
								selectable: true,
								children: []
							}
						);
					}
				}
			}
		}
		fetchRequiredNodesAndRefreshSelectors();
	});

}(
    window.wp.blocks
) );