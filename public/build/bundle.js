
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var projectsData = [
    	{
    		id: 1,
    		title: "The new station",
    		description: "Let us know what you expect from the new station and help us finalize the plans!",
    		startAt: "2015-05-14",
    		endAt: "2017-01-31",
    		importance: 0.78839,
    		img: "station.jpg",
    		region: {
    			type: "Polygon",
    			coordinates: [
    				[
    					[
    						4.368009567260742,
    						50.85226034902578
    					],
    					[
    						4.369511604309082,
    						50.84749166518619
    					],
    					[
    						4.365906715393066,
    						50.84044612654468
    					],
    					[
    						4.347925186157227,
    						50.83299295670028
    					],
    					[
    						4.343118667602539,
    						50.83369767098071
    					],
    					[
    						4.3375396728515625,
    						50.849144502855076
    					],
    					[
    						4.346122741699219,
    						50.85873522444264
    					],
    					[
    						4.368009567260742,
    						50.85226034902578
    					]
    				]
    			]
    		},
    		isFeatured: false,
    		languages: [
    			"en"
    		],
    		moderators: [
    			"Yasmin Grunder"
    		],
    		users: 161,
    		ideas: 53,
    		views: {
    			week: 15,
    			month: 188,
    			year: 9083
    		}
    	},
    	{
    		id: 2,
    		title: "Sharing is caring",
    		description: "How can we share more in our city? Can we make our lives more efficient by opening up our assets?",
    		startAt: "2011-06-23",
    		endAt: "2012-05-16",
    		importance: 0.315078,
    		img: "students.jpg",
    		region: {
    			type: "Polygon",
    			coordinates: [
    				[
    					[
    						4.3498992919921875,
    						50.833047165868834
    					],
    					[
    						4.365520477294922,
    						50.839985419652976
    					],
    					[
    						4.369125366210937,
    						50.84551360214657
    					],
    					[
    						4.407749176025391,
    						50.83781732615254
    					],
    					[
    						4.398651123046875,
    						50.82643318258604
    					],
    					[
    						4.3759918212890625,
    						50.815697018296866
    					],
    					[
    						4.372386932373047,
    						50.814503958774
    					],
    					[
    						4.370155334472656,
    						50.821228077877755
    					],
    					[
    						4.363975524902344,
    						50.827300643621655
    					],
    					[
    						4.358310699462891,
    						50.824806649699454
    					],
    					[
    						4.354190826416016,
    						50.82567414095757
    					],
    					[
    						4.3450927734375,
    						50.83250507134997
    					],
    					[
    						4.3498992919921875,
    						50.833047165868834
    					]
    				]
    			]
    		},
    		isFeatured: false,
    		languages: [
    			"en",
    			"fr"
    		],
    		moderators: [
    			"Despina Duhon"
    		],
    		users: 40,
    		ideas: 28,
    		views: {
    			week: 77,
    			month: 202,
    			year: 6484
    		}
    	},
    	{
    		id: 3,
    		title: "All you can brainstorm",
    		description: "Unrestricted idea posting, this is the place",
    		startAt: "2013-07-15",
    		endAt: "2014-09-17",
    		importance: 0.61098,
    		img: "brainstorm.jpg",
    		region: {
    			type: "Polygon",
    			coordinates: [
    				[
    					[
    						4.346294403076172,
    						50.85873522444264
    					],
    					[
    						4.338741302490234,
    						50.85049924415587
    					],
    					[
    						4.3208885192871085,
    						50.848440021829276
    					],
    					[
    						4.326896667480469,
    						50.85981879778569
    					],
    					[
    						4.330501556396484,
    						50.86339441117196
    					],
    					[
    						4.346294403076172,
    						50.85873522444264
    					]
    				]
    			]
    		},
    		isFeatured: false,
    		languages: [
    			"en"
    		],
    		moderators: [
    			"Hermine Foret"
    		],
    		users: 93,
    		ideas: 93,
    		views: {
    			week: 28,
    			month: 153,
    			year: 8898
    		}
    	},
    	{
    		id: 4,
    		title: "Redraw Waterflow wood with us",
    		description: "Tell us how you would draw the plans for the renewed wood planning",
    		startAt: "2016-08-08",
    		endAt: "2017-03-01",
    		importance: 0.783035,
    		img: "forest.jpg",
    		region: {
    			type: "Polygon",
    			coordinates: [
    				[
    					[
    						4.353160858154297,
    						50.8865750680795
    					],
    					[
    						4.361057281494141,
    						50.8744445735763
    					],
    					[
    						4.373931884765625,
    						50.88180989329175
    					],
    					[
    						4.376506805419922,
    						50.886791655353164
    					],
    					[
    						4.359683990478516,
    						50.89372191643622
    					],
    					[
    						4.357624053955078,
    						50.89328880532674
    					],
    					[
    						4.3471527099609375,
    						50.89826933991605
    					],
    					[
    						4.339599609375,
    						50.89350536138496
    					],
    					[
    						4.353160858154297,
    						50.8865750680795
    					]
    				]
    			]
    		},
    		isFeatured: true,
    		languages: [
    			"en",
    			"fr"
    		],
    		moderators: [
    			"Kermit Mccraw",
    			"Yasmin Grunder"
    		],
    		users: 163,
    		ideas: 95,
    		views: {
    			week: 69,
    			month: 139,
    			year: 7248
    		}
    	},
    	{
    		id: 5,
    		title: "Culture for all",
    		description: "How can we make the cultural offer of the city more accessible for everyone?",
    		startAt: "2013-08-15",
    		endAt: "2018-01-11",
    		importance: 0.850566,
    		img: "camera.jpg",
    		region: null,
    		isFeatured: false,
    		languages: [
    			"en"
    		],
    		moderators: [
    			"Kermit Martenson"
    		],
    		users: 29,
    		ideas: 43,
    		views: {
    			week: 31,
    			month: 269,
    			year: 9070
    		}
    	},
    	{
    		id: 6,
    		title: "New traffic plan for city square",
    		description: "Have some suggestions? Ideas to improve the huge amount of traffic? Help the local shops",
    		startAt: "2015-06-07",
    		endAt: "2016-12-26",
    		importance: 0.489123,
    		img: "square.jpg",
    		region: {
    			type: "Polygon",
    			coordinates: [
    				[
    					[
    						4.368009567260742,
    						50.85226034902578
    					],
    					[
    						4.369511604309082,
    						50.84749166518619
    					],
    					[
    						4.365906715393066,
    						50.84044612654468
    					],
    					[
    						4.347925186157227,
    						50.83299295670028
    					],
    					[
    						4.343118667602539,
    						50.83369767098071
    					],
    					[
    						4.3375396728515625,
    						50.849144502855076
    					],
    					[
    						4.346122741699219,
    						50.85873522444264
    					],
    					[
    						4.368009567260742,
    						50.85226034902578
    					]
    				]
    			]
    		},
    		isFeatured: false,
    		languages: [
    			"en",
    			"fr",
    			"nl"
    		],
    		moderators: [
    			"Antwan Tosto"
    		],
    		users: 174,
    		ideas: 88,
    		views: {
    			week: 36,
    			month: 194,
    			year: 9861
    		}
    	}
    ];

    function fetchProjects () {
      return new Promise((resolve, reject) => {
        projects.set(projectsData);
        resolve();
      })
    }

    const projects = writable();

    var tagsData = [
    	{
    		label: "health",
    		score: 0.113938
    	},
    	{
    		label: "traffic",
    		score: 0.544215
    	},
    	{
    		label: "streets",
    		score: 0.529549
    	},
    	{
    		label: "infrastructure",
    		score: 0.833819
    	},
    	{
    		label: "echinital",
    		score: 0.425693
    	},
    	{
    		label: "architecture",
    		score: 0.366833
    	},
    	{
    		label: "culture",
    		score: 0.88699
    	},
    	{
    		label: "governance",
    		score: 0.260472
    	},
    	{
    		label: "elderly",
    		score: 0.0410126
    	},
    	{
    		label: "mobile",
    		score: 0.506603
    	},
    	{
    		label: "nature",
    		score: 0.994411
    	},
    	{
    		label: "community",
    		score: 0.386739
    	},
    	{
    		label: "together",
    		score: 0.518047
    	},
    	{
    		label: "neighbours",
    		score: 0.315571
    	},
    	{
    		label: "green",
    		score: 0.713613
    	}
    ];

    function fetchTags () {
      return new Promise((resolve, reject) => {
        tags.set(tagsData);
        resolve();
      })
    }

    const tags = writable();

    /* src/panels/Header.svelte generated by Svelte v3.38.2 */

    const file$5 = "src/panels/Header.svelte";

    function create_fragment$5(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = "img/Labbersville.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Labbelsville logo");
    			add_location(img, file$5, 2, 4, 87);
    			attr_dev(div0, "class", "sticky max-w-7xl mx-auto flex h-24");
    			add_location(div0, file$5, 1, 2, 34);
    			attr_dev(div1, "class", "w-screen bg-white");
    			add_location(div1, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/panels/WelcomeText.svelte generated by Svelte v3.38.2 */

    const file$4 = "src/panels/WelcomeText.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Welcome to the participation platform of Labbersville. This site is dedicated to every citizen.";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Together, we want to combine our strengths in order to collaboratively improve our city. Step by step, idea by idea, citizen by citizen! Help us out!";
    			attr_dev(h1, "class", "text-gray-700 text-2xl font-bold text-center");
    			add_location(h1, file$4, 2, 4, 93);
    			attr_dev(p, "class", "text-gray-800 text-lg");
    			add_location(p, file$4, 6, 4, 269);
    			attr_dev(div0, "class", "max-w-7xl mx-auto space-y-3 px-2 py-8");
    			add_location(div0, file$4, 1, 2, 37);
    			attr_dev(div1, "class", "w-screen bg-blue-200");
    			add_location(div1, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WelcomeText", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WelcomeText> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class WelcomeText extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WelcomeText",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/ProjectCard.svelte generated by Svelte v3.38.2 */

    const file$3 = "src/components/ProjectCard.svelte";

    function create_fragment$3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "w-40 h-50 bg-red-200");
    			add_location(div, file$3, 4, 0, 49);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProjectCard", slots, []);
    	let { projectMetadata } = $$props;
    	const writable_props = ["projectMetadata"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProjectCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("projectMetadata" in $$props) $$invalidate(0, projectMetadata = $$props.projectMetadata);
    	};

    	$$self.$capture_state = () => ({ projectMetadata });

    	$$self.$inject_state = $$props => {
    		if ("projectMetadata" in $$props) $$invalidate(0, projectMetadata = $$props.projectMetadata);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [projectMetadata];
    }

    class ProjectCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { projectMetadata: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectCard",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*projectMetadata*/ ctx[0] === undefined && !("projectMetadata" in props)) {
    			console.warn("<ProjectCard> was created without expected prop 'projectMetadata'");
    		}
    	}

    	get projectMetadata() {
    		throw new Error("<ProjectCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectMetadata(value) {
    		throw new Error("<ProjectCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/panels/Projects.svelte generated by Svelte v3.38.2 */
    const file$2 = "src/panels/Projects.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (14:0) {#if mounted}
    function create_if_block(ctx) {
    	let div;
    	let current;
    	let each_value = /*$projects*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "");
    			add_location(div, file$2, 14, 2, 295);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$projects*/ 2) {
    				each_value = /*$projects*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(14:0) {#if mounted}",
    		ctx
    	});

    	return block;
    }

    // (16:4) {#each $projects as project}
    function create_each_block(ctx) {
    	let projectcard;
    	let current;

    	projectcard = new ProjectCard({
    			props: { project: /*project*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(projectcard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(projectcard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const projectcard_changes = {};
    			if (dirty & /*$projects*/ 2) projectcard_changes.project = /*project*/ ctx[2];
    			projectcard.$set(projectcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(projectcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(projectcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(projectcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(16:4) {#each $projects as project}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*mounted*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*mounted*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*mounted*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $projects;
    	validate_store(projects, "projects");
    	component_subscribe($$self, projects, $$value => $$invalidate(1, $projects = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Projects", slots, []);
    	let mounted = false;

    	onMount(async () => {
    		await fetchProjects();
    		$$invalidate(0, mounted = true);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		fetchProjects,
    		projects,
    		ProjectCard,
    		mounted,
    		$projects
    	});

    	$$self.$inject_state = $$props => {
    		if ("mounted" in $$props) $$invalidate(0, mounted = $$props.mounted);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [mounted, $projects];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/panels/MainContent.svelte generated by Svelte v3.38.2 */
    const file$1 = "src/panels/MainContent.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let welcometext;
    	let t;
    	let projects;
    	let current;
    	welcometext = new WelcomeText({ $$inline: true });
    	projects = new Projects({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(welcometext.$$.fragment);
    			t = space();
    			create_component(projects.$$.fragment);
    			attr_dev(div, "class", "flex flex-col");
    			add_location(div, file$1, 5, 0, 112);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(welcometext, div, null);
    			append_dev(div, t);
    			mount_component(projects, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(welcometext.$$.fragment, local);
    			transition_in(projects.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(welcometext.$$.fragment, local);
    			transition_out(projects.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(welcometext);
    			destroy_component(projects);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MainContent", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MainContent> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ WelcomeText, Projects });
    	return [];
    }

    class MainContent extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MainContent",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let div;
    	let header;
    	let t;
    	let maincontent;
    	let current;
    	header = new Header({ $$inline: true });
    	maincontent = new MainContent({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(header.$$.fragment);
    			t = space();
    			create_component(maincontent.$$.fragment);
    			attr_dev(div, "class", "bg-gray-200 h-screen");
    			add_location(div, file, 9, 0, 258);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(header, div, null);
    			append_dev(div, t);
    			mount_component(maincontent, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(maincontent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(maincontent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(header);
    			destroy_component(maincontent);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		fetchProjects,
    		fetchTags,
    		Header,
    		MainContent
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
