
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
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
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
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

    const file$9 = "src/panels/Header.svelte";

    function create_fragment$9(ctx) {
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
    			add_location(img, file$9, 2, 4, 92);
    			attr_dev(div0, "class", "sticky max-w-7xl mx-auto flex h-28 py-4");
    			add_location(div0, file$9, 1, 2, 34);
    			attr_dev(div1, "class", "w-screen bg-white");
    			add_location(div1, file$9, 0, 0, 0);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/panels/WelcomeText.svelte generated by Svelte v3.38.2 */

    const file$8 = "src/panels/WelcomeText.svelte";

    function create_fragment$8(ctx) {
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
    			attr_dev(h1, "class", "text-gray-700 text-2xl font-bold");
    			add_location(h1, file$8, 2, 4, 105);
    			attr_dev(p, "class", "text-gray-800 text-lg");
    			add_location(p, file$8, 6, 4, 269);
    			attr_dev(div0, "class", "max-w-7xl mx-auto space-y-3 px-2 py-8");
    			add_location(div0, file$8, 1, 2, 49);
    			attr_dev(div1, "class", "w-screen bg-blue-200 text-center");
    			add_location(div1, file$8, 0, 0, 0);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WelcomeText",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/SubscribeButton.svelte generated by Svelte v3.38.2 */
    const file$7 = "src/components/SubscribeButton.svelte";

    function create_fragment$7(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Subscribe to projects";
    			attr_dev(button, "class", "bg-blue-700 rounded-xl px-3 py-2 text-white font-bold hover:bg-blue-500");
    			add_location(button, file$7, 10, 0, 170);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SubscribeButton", slots, []);
    	const dispatch = createEventDispatcher();

    	function click() {
    		dispatch("click", true);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SubscribeButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ createEventDispatcher, dispatch, click });
    	return [click];
    }

    class SubscribeButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SubscribeButton",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/ConfirmSubscriptionButton.svelte generated by Svelte v3.38.2 */
    const file$6 = "src/components/ConfirmSubscriptionButton.svelte";

    function create_fragment$6(ctx) {
    	let button;
    	let t;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("Confirm subscription");

    			attr_dev(button, "class", button_class_value = `
    ${/*disabled*/ ctx[0] ? "cursor-not-allowed" : ""}
    ${/*disabled*/ ctx[0]
			? "bg-green-300"
			: "bg-green-700 hover:bg-green-500"}
    rounded-xl px-3 py-2 text-white font-bold
  `);

    			add_location(button, file$6, 12, 0, 193);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*disabled*/ 1 && button_class_value !== (button_class_value = `
    ${/*disabled*/ ctx[0] ? "cursor-not-allowed" : ""}
    ${/*disabled*/ ctx[0]
			? "bg-green-300"
			: "bg-green-700 hover:bg-green-500"}
    rounded-xl px-3 py-2 text-white font-bold
  `)) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ConfirmSubscriptionButton", slots, []);
    	let { disabled } = $$props;
    	const dispatch = createEventDispatcher();

    	function click() {
    		dispatch("click", true);
    	}

    	const writable_props = ["disabled"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ConfirmSubscriptionButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("disabled" in $$props) $$invalidate(0, disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		disabled,
    		dispatch,
    		click
    	});

    	$$self.$inject_state = $$props => {
    		if ("disabled" in $$props) $$invalidate(0, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [disabled, click];
    }

    class ConfirmSubscriptionButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { disabled: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ConfirmSubscriptionButton",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*disabled*/ ctx[0] === undefined && !("disabled" in props)) {
    			console.warn("<ConfirmSubscriptionButton> was created without expected prop 'disabled'");
    		}
    	}

    	get disabled() {
    		throw new Error("<ConfirmSubscriptionButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<ConfirmSubscriptionButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src/icons/User.svelte generated by Svelte v3.38.2 */

    const file$5 = "src/icons/User.svelte";

    function create_fragment$5(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z");
    			add_location(path, file$5, 1, 2, 126);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "h-4 w-4 inline-block");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
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
    	validate_slots("User", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<User> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class User extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "User",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/icons/Idea.svelte generated by Svelte v3.38.2 */

    const file$4 = "src/icons/Idea.svelte";

    function create_fragment$4(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z");
    			add_location(path, file$4, 1, 2, 126);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "h-4 w-4 inline-block");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
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
    	validate_slots("Idea", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Idea> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Idea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Idea",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/ProjectCard.svelte generated by Svelte v3.38.2 */
    const file$3 = "src/components/ProjectCard.svelte";

    // (33:6) {#if showCheckbox}
    function create_if_block$1(ctx) {
    	let input;
    	let input_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$3, 33, 8, 774);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			input.checked = /*checked*/ ctx[2];
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*checked*/ 4) {
    				input.checked = /*checked*/ ctx[2];
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!input_transition) input_transition = create_bidirectional_transition(input, fade, {}, true);
    				input_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!input_transition) input_transition = create_bidirectional_transition(input, fade, {}, false);
    			input_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching && input_transition) input_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(33:6) {#if showCheckbox}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div10;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div9;
    	let div1;
    	let h3;
    	let t1_value = /*project*/ ctx[0].title + "";
    	let t1;
    	let t2;
    	let t3;
    	let div2;
    	let t4_value = /*project*/ ctx[0].description + "";
    	let t4;
    	let t5;
    	let div5;
    	let div3;
    	let t7;
    	let div4;
    	let t8_value = /*project*/ ctx[0].startAt + "";
    	let t8;
    	let t9;
    	let t10_value = /*project*/ ctx[0].endAt + "";
    	let t10;
    	let t11;
    	let div8;
    	let div6;
    	let user;
    	let t12;
    	let t13_value = /*project*/ ctx[0].users + "";
    	let t13;
    	let t14;
    	let div7;
    	let idea;
    	let t15;
    	let t16_value = /*project*/ ctx[0].ideas + "";
    	let t16;
    	let current;
    	let if_block = /*showCheckbox*/ ctx[1] && create_if_block$1(ctx);
    	user = new User({ $$inline: true });
    	idea = new Idea({ $$inline: true });

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div9 = element("div");
    			div1 = element("div");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			div2 = element("div");
    			t4 = text(t4_value);
    			t5 = space();
    			div5 = element("div");
    			div3 = element("div");
    			div3.textContent = "Period:";
    			t7 = space();
    			div4 = element("div");
    			t8 = text(t8_value);
    			t9 = text(" - ");
    			t10 = text(t10_value);
    			t11 = space();
    			div8 = element("div");
    			div6 = element("div");
    			create_component(user.$$.fragment);
    			t12 = space();
    			t13 = text(t13_value);
    			t14 = space();
    			div7 = element("div");
    			create_component(idea.$$.fragment);
    			t15 = space();
    			t16 = text(t16_value);
    			if (img.src !== (img_src_value = `img/${/*project*/ ctx[0].img}`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*project*/ ctx[0].img);
    			add_location(img, file$3, 22, 4, 497);
    			attr_dev(div0, "class", "flex w-1/1");
    			add_location(div0, file$3, 21, 2, 468);
    			attr_dev(h3, "class", "text-blue-800 text-lg font-bold");
    			add_location(h3, file$3, 30, 6, 669);
    			attr_dev(div1, "class", "flex flex-row justify-between");
    			add_location(div1, file$3, 29, 4, 619);
    			attr_dev(div2, "class", "text-gray-800");
    			add_location(div2, file$3, 37, 4, 867);
    			attr_dev(div3, "class", "text-gray-800 font-bold text-sm");
    			add_location(div3, file$3, 42, 6, 1008);
    			attr_dev(div4, "class", "text-gray-700 text-sm");
    			add_location(div4, file$3, 43, 6, 1073);
    			attr_dev(div5, "class", "flex flex-row justify-between border rounded p-2");
    			add_location(div5, file$3, 41, 4, 939);
    			attr_dev(div6, "class", "");
    			add_location(div6, file$3, 47, 6, 1196);
    			attr_dev(div7, "class", "");
    			add_location(div7, file$3, 51, 6, 1271);
    			attr_dev(div8, "class", "space-y-2");
    			add_location(div8, file$3, 46, 4, 1166);
    			attr_dev(div9, "class", "px-6 py-4 space-y-2");
    			add_location(div9, file$3, 28, 2, 581);
    			attr_dev(div10, "class", "bg-white rounded-lg shadow-lg overflow-hidden grid grid-cols-2");
    			add_location(div10, file$3, 20, 0, 389);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div0);
    			append_dev(div0, img);
    			append_dev(div10, t0);
    			append_dev(div10, div9);
    			append_dev(div9, div1);
    			append_dev(div1, h3);
    			append_dev(h3, t1);
    			append_dev(div1, t2);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div9, t3);
    			append_dev(div9, div2);
    			append_dev(div2, t4);
    			append_dev(div9, t5);
    			append_dev(div9, div5);
    			append_dev(div5, div3);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			append_dev(div4, t8);
    			append_dev(div4, t9);
    			append_dev(div4, t10);
    			append_dev(div9, t11);
    			append_dev(div9, div8);
    			append_dev(div8, div6);
    			mount_component(user, div6, null);
    			append_dev(div6, t12);
    			append_dev(div6, t13);
    			append_dev(div8, t14);
    			append_dev(div8, div7);
    			mount_component(idea, div7, null);
    			append_dev(div7, t15);
    			append_dev(div7, t16);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*project*/ 1 && img.src !== (img_src_value = `img/${/*project*/ ctx[0].img}`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*project*/ 1 && img_alt_value !== (img_alt_value = /*project*/ ctx[0].img)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if ((!current || dirty & /*project*/ 1) && t1_value !== (t1_value = /*project*/ ctx[0].title + "")) set_data_dev(t1, t1_value);

    			if (/*showCheckbox*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showCheckbox*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*project*/ 1) && t4_value !== (t4_value = /*project*/ ctx[0].description + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty & /*project*/ 1) && t8_value !== (t8_value = /*project*/ ctx[0].startAt + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty & /*project*/ 1) && t10_value !== (t10_value = /*project*/ ctx[0].endAt + "")) set_data_dev(t10, t10_value);
    			if ((!current || dirty & /*project*/ 1) && t13_value !== (t13_value = /*project*/ ctx[0].users + "")) set_data_dev(t13, t13_value);
    			if ((!current || dirty & /*project*/ 1) && t16_value !== (t16_value = /*project*/ ctx[0].ideas + "")) set_data_dev(t16, t16_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(user.$$.fragment, local);
    			transition_in(idea.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(user.$$.fragment, local);
    			transition_out(idea.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			if (if_block) if_block.d();
    			destroy_component(user);
    			destroy_component(idea);
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
    	let { project } = $$props;
    	let { showCheckbox } = $$props;
    	const dispatch = createEventDispatcher();
    	let checked;

    	function check(value) {
    		dispatch("check", value);
    	}

    	const writable_props = ["project", "showCheckbox"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProjectCard> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		checked = this.checked;
    		$$invalidate(2, checked);
    	}

    	$$self.$$set = $$props => {
    		if ("project" in $$props) $$invalidate(0, project = $$props.project);
    		if ("showCheckbox" in $$props) $$invalidate(1, showCheckbox = $$props.showCheckbox);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		createEventDispatcher,
    		User,
    		Idea,
    		project,
    		showCheckbox,
    		dispatch,
    		checked,
    		check
    	});

    	$$self.$inject_state = $$props => {
    		if ("project" in $$props) $$invalidate(0, project = $$props.project);
    		if ("showCheckbox" in $$props) $$invalidate(1, showCheckbox = $$props.showCheckbox);
    		if ("checked" in $$props) $$invalidate(2, checked = $$props.checked);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*checked*/ 4) {
    			{
    				check(checked);
    			}
    		}
    	};

    	return [project, showCheckbox, checked, input_change_handler];
    }

    class ProjectCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { project: 0, showCheckbox: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectCard",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*project*/ ctx[0] === undefined && !("project" in props)) {
    			console.warn("<ProjectCard> was created without expected prop 'project'");
    		}

    		if (/*showCheckbox*/ ctx[1] === undefined && !("showCheckbox" in props)) {
    			console.warn("<ProjectCard> was created without expected prop 'showCheckbox'");
    		}
    	}

    	get project() {
    		throw new Error("<ProjectCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set project(value) {
    		throw new Error("<ProjectCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showCheckbox() {
    		throw new Error("<ProjectCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showCheckbox(value) {
    		throw new Error("<ProjectCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/panels/Projects.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1 } = globals;
    const file$2 = "src/panels/Projects.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (29:0) {#if mounted}
    function create_if_block(ctx) {
    	let div2;
    	let div0;
    	let h1;
    	let t1;
    	let t2;
    	let t3;
    	let div1;
    	let current;
    	let if_block0 = !/*subscribeDone*/ ctx[2] && create_if_block_2(ctx);
    	let if_block1 = /*subscribeDone*/ ctx[2] && create_if_block_1(ctx);
    	let each_value = /*$projects*/ ctx[4];
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
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Projects";
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "text-xl font-bold text-gray-800");
    			add_location(h1, file$2, 33, 6, 806);
    			attr_dev(div0, "class", "flex flex-row justify-between items-center p-3 pb-7");
    			add_location(div0, file$2, 32, 4, 734);
    			attr_dev(div1, "class", "grid grid-flow-row grid-cols-2 gap-4");
    			add_location(div1, file$2, 53, 4, 1312);
    			attr_dev(div2, "class", "max-w-7xl mx-auto px-2 py-8");
    			add_location(div2, file$2, 30, 2, 685);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t2);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div2, t3);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!/*subscribeDone*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*subscribeDone*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*subscribeDone*/ ctx[2]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*$projects, subscribeOn, subscribeDone, handleCheck*/ 54) {
    				each_value = /*$projects*/ ctx[4];
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
    						each_blocks[i].m(div1, null);
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
    			transition_in(if_block0);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(29:0) {#if mounted}",
    		ctx
    	});

    	return block;
    }

    // (36:6) {#if !subscribeDone}
    function create_if_block_2(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = !/*subscribeOn*/ ctx[1] && create_if_block_4(ctx);
    	let if_block1 = /*subscribeOn*/ ctx[1] && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!/*subscribeOn*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*subscribeOn*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*subscribeOn*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*subscribeOn*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(36:6) {#if !subscribeDone}",
    		ctx
    	});

    	return block;
    }

    // (37:8) {#if !subscribeOn}
    function create_if_block_4(ctx) {
    	let subscribebutton;
    	let current;
    	subscribebutton = new SubscribeButton({ $$inline: true });
    	subscribebutton.$on("click", /*click_handler*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(subscribebutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(subscribebutton, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(subscribebutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(subscribebutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(subscribebutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(37:8) {#if !subscribeOn}",
    		ctx
    	});

    	return block;
    }

    // (41:8) {#if subscribeOn}
    function create_if_block_3(ctx) {
    	let confirmsubscriptionbutton;
    	let current;

    	confirmsubscriptionbutton = new ConfirmSubscriptionButton({
    			props: {
    				disabled: Object.keys(/*selectedCards*/ ctx[3]).length === 0
    			},
    			$$inline: true
    		});

    	confirmsubscriptionbutton.$on("click", /*click_handler_1*/ ctx[7]);

    	const block = {
    		c: function create() {
    			create_component(confirmsubscriptionbutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(confirmsubscriptionbutton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const confirmsubscriptionbutton_changes = {};
    			if (dirty & /*selectedCards*/ 8) confirmsubscriptionbutton_changes.disabled = Object.keys(/*selectedCards*/ ctx[3]).length === 0;
    			confirmsubscriptionbutton.$set(confirmsubscriptionbutton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(confirmsubscriptionbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(confirmsubscriptionbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(confirmsubscriptionbutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(41:8) {#if subscribeOn}",
    		ctx
    	});

    	return block;
    }

    // (49:6) {#if subscribeDone}
    function create_if_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Thanks for subscribing!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(49:6) {#if subscribeDone}",
    		ctx
    	});

    	return block;
    }

    // (55:6) {#each $projects as project}
    function create_each_block(ctx) {
    	let projectcard;
    	let current;

    	function check_handler(...args) {
    		return /*check_handler*/ ctx[8](/*project*/ ctx[9], ...args);
    	}

    	projectcard = new ProjectCard({
    			props: {
    				project: /*project*/ ctx[9],
    				showCheckbox: /*subscribeOn*/ ctx[1] && !/*subscribeDone*/ ctx[2]
    			},
    			$$inline: true
    		});

    	projectcard.$on("check", check_handler);

    	const block = {
    		c: function create() {
    			create_component(projectcard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(projectcard, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const projectcard_changes = {};
    			if (dirty & /*$projects*/ 16) projectcard_changes.project = /*project*/ ctx[9];
    			if (dirty & /*subscribeOn, subscribeDone*/ 6) projectcard_changes.showCheckbox = /*subscribeOn*/ ctx[1] && !/*subscribeDone*/ ctx[2];
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
    		source: "(55:6) {#each $projects as project}",
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
    	component_subscribe($$self, projects, $$value => $$invalidate(4, $projects = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Projects", slots, []);
    	let mounted = false;
    	let subscribeOn = false;
    	let subscribeDone = false;
    	let selectedCards = {};

    	onMount(async () => {
    		await fetchProjects();
    		$$invalidate(0, mounted = true);
    	});

    	function handleCheck(value, id) {
    		if (value) {
    			$$invalidate(3, selectedCards[id] = true, selectedCards);
    		}

    		if (!value) {
    			delete selectedCards[id];
    		}
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(1, subscribeOn = true);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(2, subscribeDone = true);
    	};

    	const check_handler = (project, value) => {
    		handleCheck(value, project.id);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		fetchProjects,
    		projects,
    		SubscribeButton,
    		ConfirmSubscriptionButton,
    		ProjectCard,
    		mounted,
    		subscribeOn,
    		subscribeDone,
    		selectedCards,
    		handleCheck,
    		$projects
    	});

    	$$self.$inject_state = $$props => {
    		if ("mounted" in $$props) $$invalidate(0, mounted = $$props.mounted);
    		if ("subscribeOn" in $$props) $$invalidate(1, subscribeOn = $$props.subscribeOn);
    		if ("subscribeDone" in $$props) $$invalidate(2, subscribeDone = $$props.subscribeDone);
    		if ("selectedCards" in $$props) $$invalidate(3, selectedCards = $$props.selectedCards);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		mounted,
    		subscribeOn,
    		subscribeDone,
    		selectedCards,
    		$projects,
    		handleCheck,
    		click_handler,
    		click_handler_1,
    		check_handler
    	];
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
    			attr_dev(div, "class", "w-screen flex flex-col");
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
    	let t0;
    	let div;
    	let header;
    	let t1;
    	let maincontent;
    	let current;
    	header = new Header({ $$inline: true });
    	maincontent = new MainContent({ $$inline: true });

    	const block = {
    		c: function create() {
    			t0 = space();
    			div = element("div");
    			create_component(header.$$.fragment);
    			t1 = space();
    			create_component(maincontent.$$.fragment);
    			attr_dev(div, "class", "bg-gray-100 antialiased h-full");
    			add_location(div, file, 11, 0, 301);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(header, div, null);
    			append_dev(div, t1);
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
    			if (detaching) detach_dev(t0);
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
