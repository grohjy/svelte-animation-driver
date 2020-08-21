
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
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
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\PlayControls.svelte generated by Svelte v3.24.1 */

    const file = "src\\PlayControls.svelte";

    // (24:2) {:else}
    function create_else_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "<";
    			attr_dev(button, "class", "svelte-f7a3e2");
    			add_location(button, file, 24, 4, 462);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(24:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (22:2) {#if $props.playing && $props.direction == 'rew'}
    function create_if_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "||";
    			attr_dev(button, "class", "sel svelte-f7a3e2");
    			add_location(button, file, 22, 4, 385);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(22:2) {#if $props.playing && $props.direction == 'rew'}",
    		ctx
    	});

    	return block;
    }

    // (30:2) {:else}
    function create_else_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = ">";
    			attr_dev(button, "class", "svelte-f7a3e2");
    			add_location(button, file, 30, 4, 712);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_4*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(30:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (28:2) {#if $props.playing && $props.direction == 'fwd'}
    function create_if_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "||";
    			attr_dev(button, "class", "sel svelte-f7a3e2");
    			add_location(button, file, 28, 4, 635);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(28:2) {#if $props.playing && $props.direction == 'fwd'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let hr;
    	let t0;
    	let div1;
    	let div0;
    	let t2;
    	let t3;
    	let button0;
    	let t5;
    	let t6;
    	let div3;
    	let div2;
    	let t8;
    	let button1;
    	let t10;
    	let button2;
    	let t12;
    	let button3;
    	let t14;
    	let p;
    	let span;
    	let t15;
    	let t16_value = Math.floor(/*$ph*/ ctx[1] * 100) / 100 + "";
    	let t16;
    	let t17;
    	let br;
    	let t18;
    	let input;
    	let input_value_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$props*/ ctx[2].playing && /*$props*/ ctx[2].direction == "rew") return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*$props*/ ctx[2].playing && /*$props*/ ctx[2].direction == "fwd") return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Controls:";
    			t2 = space();
    			if_block0.c();
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = "Reset";
    			t5 = space();
    			if_block1.c();
    			t6 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div2.textContent = "Speed:";
    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "x0.5";
    			t10 = space();
    			button2 = element("button");
    			button2.textContent = "x1";
    			t12 = space();
    			button3 = element("button");
    			button3.textContent = "x2";
    			t14 = space();
    			p = element("p");
    			span = element("span");
    			t15 = text("Playhead:");
    			t16 = text(t16_value);
    			t17 = space();
    			br = element("br");
    			t18 = space();
    			input = element("input");
    			add_location(hr, file, 18, 0, 248);
    			set_style(div0, "display", "inline-block");
    			set_style(div0, "width", "60px");
    			add_location(div0, file, 20, 2, 265);
    			attr_dev(button0, "class", "svelte-f7a3e2");
    			add_location(button0, file, 26, 2, 525);
    			add_location(div1, file, 19, 0, 256);
    			set_style(div2, "display", "inline-block");
    			set_style(div2, "width", "60px");
    			add_location(div2, file, 34, 2, 788);
    			attr_dev(button1, "class", "svelte-f7a3e2");
    			toggle_class(button1, "sel", /*$props*/ ctx[2].speed == 0.5);
    			add_location(button1, file, 35, 2, 850);
    			attr_dev(button2, "class", "svelte-f7a3e2");
    			toggle_class(button2, "sel", /*$props*/ ctx[2].speed == 1);
    			add_location(button2, file, 38, 2, 955);
    			attr_dev(button3, "class", "svelte-f7a3e2");
    			toggle_class(button3, "sel", /*$props*/ ctx[2].speed == 2);
    			add_location(button3, file, 41, 2, 1054);
    			add_location(div3, file, 33, 0, 779);
    			add_location(span, file, 46, 2, 1166);
    			add_location(br, file, 47, 2, 1221);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", "500");
    			input.value = input_value_value = /*$ph*/ ctx[1] * 500;
    			add_location(input, file, 48, 2, 1231);
    			add_location(p, file, 45, 0, 1159);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t2);
    			if_block0.m(div1, null);
    			append_dev(div1, t3);
    			append_dev(div1, button0);
    			append_dev(div1, t5);
    			if_block1.m(div1, null);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div3, t8);
    			append_dev(div3, button1);
    			append_dev(div3, t10);
    			append_dev(div3, button2);
    			append_dev(div3, t12);
    			append_dev(div3, button3);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, span);
    			append_dev(span, t15);
    			append_dev(span, t16);
    			append_dev(p, t17);
    			append_dev(p, br);
    			append_dev(p, t18);
    			append_dev(p, input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_2*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*click_handler_5*/ ctx[10], false, false, false),
    					listen_dev(button2, "click", /*click_handler_6*/ ctx[11], false, false, false),
    					listen_dev(button3, "click", /*click_handler_7*/ ctx[12], false, false, false),
    					listen_dev(input, "input", /*input_handler*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div1, t3);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			}

    			if (dirty & /*$props*/ 4) {
    				toggle_class(button1, "sel", /*$props*/ ctx[2].speed == 0.5);
    			}

    			if (dirty & /*$props*/ 4) {
    				toggle_class(button2, "sel", /*$props*/ ctx[2].speed == 1);
    			}

    			if (dirty & /*$props*/ 4) {
    				toggle_class(button3, "sel", /*$props*/ ctx[2].speed == 2);
    			}

    			if (dirty & /*$ph*/ 2 && t16_value !== (t16_value = Math.floor(/*$ph*/ ctx[1] * 100) / 100 + "")) set_data_dev(t16, t16_value);

    			if (dirty & /*$ph*/ 2 && input_value_value !== (input_value_value = /*$ph*/ ctx[1] * 500)) {
    				prop_dev(input, "value", input_value_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if_block0.d();
    			if_block1.d();
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(p);
    			mounted = false;
    			run_all(dispose);
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
    	let $ph;
    	let $props;
    	let { drv } = $$props;
    	let props = drv.propsStore;
    	validate_store(props, "props");
    	component_subscribe($$self, props, value => $$invalidate(2, $props = value));
    	let ph = drv.playheadStore;
    	validate_store(ph, "ph");
    	component_subscribe($$self, ph, value => $$invalidate(1, $ph = value));
    	set_store_value(ph, $ph = 0);
    	const writable_props = ["drv"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PlayControls> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PlayControls", $$slots, []);
    	const click_handler = () => drv.pause();
    	const click_handler_1 = () => drv.rewind();
    	const click_handler_2 = () => drv.reset();
    	const click_handler_3 = () => drv.pause();
    	const click_handler_4 = () => drv.play();
    	const click_handler_5 = () => set_store_value(props, $props.speed = 0.5, $props);
    	const click_handler_6 = () => set_store_value(props, $props.speed = 1, $props);
    	const click_handler_7 = () => set_store_value(props, $props.speed = 2, $props);

    	const input_handler = e => {
    		set_store_value(ph, $ph = e.target.value / 500);
    	};

    	$$self.$$set = $$props => {
    		if ("drv" in $$props) $$invalidate(0, drv = $$props.drv);
    	};

    	$$self.$capture_state = () => ({ drv, props, ph, $ph, $props });

    	$$self.$inject_state = $$props => {
    		if ("drv" in $$props) $$invalidate(0, drv = $$props.drv);
    		if ("props" in $$props) $$invalidate(3, props = $$props.props);
    		if ("ph" in $$props) $$invalidate(4, ph = $$props.ph);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		drv,
    		$ph,
    		$props,
    		props,
    		ph,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		input_handler
    	];
    }

    class PlayControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { drv: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlayControls",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*drv*/ ctx[0] === undefined && !("drv" in props)) {
    			console.warn("<PlayControls> was created without expected prop 'drv'");
    		}
    	}

    	get drv() {
    		throw new Error("<PlayControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set drv(value) {
    		throw new Error("<PlayControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
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

    function bounceOut(t) {
        const a = 4.0 / 11.0;
        const b = 8.0 / 11.0;
        const c = 9.0 / 10.0;
        const ca = 4356.0 / 361.0;
        const cb = 35442.0 / 1805.0;
        const cc = 16061.0 / 1805.0;
        const t2 = t * t;
        return t < a
            ? 7.5625 * t2
            : t < b
                ? 9.075 * t2 - 9.9 * t + 3.4
                : t < c
                    ? ca * t2 - cb * t + cc
                    : 10.8 * t * t - 20.52 * t + 10.72;
    }
    function elasticOut(t) {
        return (Math.sin((-13.0 * (t + 1.0) * Math.PI) / 2) * Math.pow(2.0, -10.0 * t) + 1.0);
    }
    function sineOut(t) {
        return Math.sin((t * Math.PI) / 2);
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    function animationDriver(delayStart = 0, delayEnd = 0) {
      let playhead;
      let duration = 100;
      let currentSpeed = 1;
      let cbSubAnimations = [];
      let isPlaying = false;
      let playingDir = "fwd";
      let playingMode = "once";

      let initProps = {
        speed: 1,
        playing: false,
        direction: "fwd",
        mode: "once",
      };
      /*
       * "store" is svelte-store "tweened" responsible of running actual t-value
       *
       * "propsStore" is svelte-store for animation properties
       * Properties:
       * speed : number, greater than 0
       * playing: true|false
       * direction: "fwd" | "rew"
       * mode: "once" | "loop" | "alternate"
       *
       * "playheadStore" is svelte-store for playhead position
       *
       */

      const store = tweened(0);
      const propsStore = writable();
      const playheadStore = writable(0);

      const tryNumber = (nb) => {
        try {
          if (typeof nb !== "number" || isNaN(nb))
            throw new SyntaxError("Value must be a number");
        } catch (error) {
          console.error(error);
        }
      };

      const getSubAnimationT = (delay, dur) => {
        let t;
        delay = (delay + delayStart) / currentSpeed;
        dur = dur / currentSpeed;
        let driverDur = (duration + delayStart + delayEnd) / currentSpeed;
        if (delay > 0) {
          t =
            (((playhead - delay / driverDur) / ((driverDur - delay) / driverDur)) *
              (driverDur - delay)) /
            dur;
        } else {
          t = (playhead * driverDur) / dur;
        }
        if (t <= 0) t = 0;
        if (t > 1) t = 1;

        return t;
      };

      const updatePlayhead = (tvalue) => {
        playhead = tvalue;
        if (isPlaying) {
          if (playingMode == "once") {
            if (playhead >= 1) {
              propsStore.set({ playing: false });
            }
            if (playhead <= 0) {
              propsStore.set({ playing: false });
            }
          } else if (playingMode == "loop") {
            if (playhead >= 1) {
              playheadStore.set(0.0001);
            }
            if (playhead <= 0) {
              playheadStore.set(0.9999);
            }
          } else if (playingMode == "alternate") {
            if (playhead >= 1) {
              propsStore.set({ direction: "rew" });
            }
            if (playhead <= 0) {
              propsStore.set({ direction: "fwd" });
            }
          }
        }
        playheadStore.update((oldValue) => {
          return playhead;
        });
        cbSubAnimations.forEach((subanim) => {
          subanim();
        });
      };

      const runUpdatedAnimation = () => {
        if (isPlaying) {
          if (playingDir == "fwd" && playhead < 1) {
            store.set(1, {
              duration:
                ((duration + delayStart + delayEnd) / currentSpeed) *
                (1 - playhead),
            });
          } else if (playingDir == "rew" && playhead > 0) {
            store.set(0, {
              duration:
                ((duration + delayStart + delayEnd) / currentSpeed) * playhead,
            });
          }
        }
      };

      store.subscribe((tValue) => {
        updatePlayhead(tValue);
      });

      propsStore.subscribe((value) => {
        runUpdatedAnimation();
      });

      propsStore.set = (value) => {
        if (typeof value !== "object") value = {};
        if ("speed" in value && typeof value.speed === "number" && value.speed > 0)
          currentSpeed = value.speed;
        else delete value.speed;
        if ("playing" in value && typeof value.playing === "boolean")
          isPlaying = value.playing;
        else delete value.playing;
        if ("direction" in value && typeof value.direction === "string")
          playingDir = value.direction;
        else delete value.direction;
        if ("mode" in value && typeof value.mode === "string")
          playingMode = value.mode;
        else delete value.mode;
        propsStore.update((oldValue) => {
          return { ...oldValue, ...value };
        });
      };

      playheadStore.set = (value) => {
        tryNumber(value);
        if (value > 1) value = 1;
        if (value < 0) value = 0;
        if (playhead == value) {
          store.set(value + 0.0001, { duration: 0 });
        }
        store.set(value, { duration: 0 });
        propsStore.set({});
      };

      function addAnimation(delay, dur, fn) {
        let animdur = delay + dur;
        duration = duration < animdur ? animdur : duration;
        propsStore.set({ speed: currentSpeed });
        let tAnim, tAnimOrig;
        const cbUpdate = () => {
          let t = getSubAnimationT(delay, dur);
          tAnim = t;
          tAnimOrig = t;
          fn(t);
        };
        cbSubAnimations.push(cbUpdate);

        /*
         * Helper functions for manipulating sub-animation's t-value
         * "slice(startPos, endPos)" gives a new t-value (0->1) when original t-value is between "pos"es
         * "repeat(nb)" gives a new t-value nb times during original t-value
         * "steps(nb, [activate] )" changes original t-value to stepped value, optional "activate" defines will step
         * take place at "start", "middle" or "end" of value stream
         * "cycle" gives a new t-value 0->1->0 when original t-value runs 0->1
         * "valueOf" gives actual modified t-value and is needed in the end of every function chain.
         *
         */
        this.slice = function (startPos, endPos) {
          let tModified = 0;
          if (endPos < startPos) {
            let temp = endPos;
            endPos = startPos;
            startPos = temp;
          }
          if (tAnim < startPos) tModified = 0;
          else if (tAnim > endPos) tModified = 1;
          else {
            tModified = (tAnim - startPos) / (endPos - startPos);
          }
          tAnim = tModified;
          return this;
        };
        this.repeat = function (repeat) {
          if (repeat < 1) repeat = 1;
          let tModified = 0;
          tModified = (tAnim % (1 / repeat)) * repeat;
          if (tModified == 0 && tAnim !== 0) tModified = 1;
          tAnim = tModified;
          return this;
        };
        this.steps = function (steps, activate = "end") {
          if (steps < 1) steps = 1;
          let tModified = 0;
          if (activate == "start")
            tModified = Math.floor(tAnim * steps + 0.9999) / steps;
          else if (activate == "middle")
            tModified = Math.round(tAnim * steps) / steps;
          else if (activate == "end") tModified = Math.floor(tAnim * steps) / steps;
          tAnim = tModified;
          return this;
        };
        this.cycle = function () {
          let tModified = 0;
          if (tAnim <= 0.5) tModified = tAnim * 2;
          else tModified = (1 - tAnim) * 2;
          tAnim = tModified;
          return this;
        };
        this.valueOf = function () {
          let t = tAnimOrig;
          if (tAnim !== tAnimOrig) t = tAnim;
          tAnim = tAnimOrig;
          return t;
        };
      }

      const pause = () => {
        propsStore.set({
          playing: false,
        });
        playheadStore.set(playhead);
      };

      const play = () => {
        propsStore.set({
          playing: playhead < 1 ? true : false,
          direction: "fwd",
        });
      };

      const rewind = () => {
        propsStore.set({
          playing: playhead > 0 ? true : false,
          direction: "rew",
        });
      };

      const reset = () => {
        propsStore.set({
          playing: false,
          direction: "fwd",
        });
        playheadStore.set(0);
      };

      const start = () => {
        propsStore.set({ playing: true });
      };

      propsStore.set(initProps);
      return {
        propsStore,
        playheadStore,
        addAnimation,
        pause,
        start,
        play,
        rewind,
        reset,
      };
    }

    /* src\App.svelte generated by Svelte v3.24.1 */
    const file$1 = "src\\App.svelte";

    function create_fragment$1(ctx) {
    	let div7;
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let t3;
    	let t4;
    	let div3;
    	let t5;
    	let t6;
    	let div4;
    	let t7;
    	let t8;
    	let div5;
    	let t9;
    	let t10;
    	let div6;
    	let t11;
    	let t12;
    	let playcontrols;
    	let current;

    	playcontrols = new PlayControls({
    			props: { drv: /*drv*/ ctx[9] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text("⭐");
    			t1 = space();
    			div1 = element("div");
    			t2 = text("⭐");
    			t3 = text("\r\n    Keyframed");
    			t4 = space();
    			div3 = element("div");
    			t5 = text("Cycle");
    			t6 = space();
    			div4 = element("div");
    			t7 = text("Stepped");
    			t8 = space();
    			div5 = element("div");
    			t9 = text("Delay");
    			t10 = space();
    			div6 = element("div");
    			t11 = text("Springy");
    			t12 = space();
    			create_component(playcontrols.$$.fragment);
    			set_style(div0, "position", "absolute");
    			set_style(div0, "top", "0");
    			set_style(div0, "right", "0");
    			set_style(div0, "opacity", /*x7*/ ctx[6]);
    			set_style(div0, "transform", "translate(" + /*x8*/ ctx[7] * 280 + "px,\r\n      " + bounceOut(/*x8*/ ctx[7]) * 140 + "px)");
    			add_location(div0, file$1, 32, 4, 1140);
    			set_style(div1, "position", "absolute");
    			set_style(div1, "top", "0");
    			set_style(div1, "right", "0");
    			set_style(div1, "opacity", /*x7*/ ctx[6]);
    			set_style(div1, "transform", "translate(" + /*x9*/ ctx[8] * 230 + "px,\r\n      " + bounceOut(/*x9*/ ctx[8]) * 140 + "px)");
    			add_location(div1, file$1, 37, 4, 1305);
    			set_style(div2, "position", "relative");
    			set_style(div2, "background-color", "hsl(" + (/*x6*/ ctx[5] * 40 + 300) + "deg, 100%,\r\n    70%)");
    			set_style(div2, "width", /*x5*/ ctx[4] * 200 + 50 + "px");
    			set_style(div2, "padding", "5px");
    			set_style(div2, "margin", "5px 0");
    			add_location(div2, file$1, 29, 2, 991);
    			set_style(div3, "background-color", "lightblue");
    			set_style(div3, "width", /*x4*/ ctx[3] * 200 + 50 + "px");
    			set_style(div3, "padding", "5px");
    			set_style(div3, "margin", "5px\r\n    0");
    			add_location(div3, file$1, 44, 2, 1493);
    			set_style(div4, "background-color", "lightgreen");
    			set_style(div4, "width", /*x3*/ ctx[2] * 200 + 50 + "px");
    			set_style(div4, "padding", "5px");
    			set_style(div4, "margin", "5px\r\n    0");
    			add_location(div4, file$1, 49, 2, 1618);
    			set_style(div5, "background-color", "yellow");
    			set_style(div5, "width", sineOut(/*x2*/ ctx[1]) * 200 + 50 + "px");
    			set_style(div5, "padding", "5px");
    			set_style(div5, "margin", "5px\r\n    0");
    			add_location(div5, file$1, 54, 2, 1746);
    			set_style(div6, "width", elasticOut(/*x1*/ ctx[0]) * 200 + 50 + "px");
    			set_style(div6, "background-color", "pink");
    			set_style(div6, "padding", "5px");
    			set_style(div6, "margin", "5px 0");
    			add_location(div6, file$1, 59, 2, 1877);
    			set_style(div7, "position", "relative");
    			set_style(div7, "border", "1px solid");
    			set_style(div7, "overflow", "hidden");
    			set_style(div7, "width", "450px");
    			add_location(div7, file$1, 28, 0, 909);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div2);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div2, t3);
    			append_dev(div7, t4);
    			append_dev(div7, div3);
    			append_dev(div3, t5);
    			append_dev(div7, t6);
    			append_dev(div7, div4);
    			append_dev(div4, t7);
    			append_dev(div7, t8);
    			append_dev(div7, div5);
    			append_dev(div5, t9);
    			append_dev(div7, t10);
    			append_dev(div7, div6);
    			append_dev(div6, t11);
    			insert_dev(target, t12, anchor);
    			mount_component(playcontrols, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*x7*/ 64) {
    				set_style(div0, "opacity", /*x7*/ ctx[6]);
    			}

    			if (!current || dirty & /*x8*/ 128) {
    				set_style(div0, "transform", "translate(" + /*x8*/ ctx[7] * 280 + "px,\r\n      " + bounceOut(/*x8*/ ctx[7]) * 140 + "px)");
    			}

    			if (!current || dirty & /*x7*/ 64) {
    				set_style(div1, "opacity", /*x7*/ ctx[6]);
    			}

    			if (!current || dirty & /*x9*/ 256) {
    				set_style(div1, "transform", "translate(" + /*x9*/ ctx[8] * 230 + "px,\r\n      " + bounceOut(/*x9*/ ctx[8]) * 140 + "px)");
    			}

    			if (!current || dirty & /*x6*/ 32) {
    				set_style(div2, "background-color", "hsl(" + (/*x6*/ ctx[5] * 40 + 300) + "deg, 100%,\r\n    70%)");
    			}

    			if (!current || dirty & /*x5*/ 16) {
    				set_style(div2, "width", /*x5*/ ctx[4] * 200 + 50 + "px");
    			}

    			if (!current || dirty & /*x4*/ 8) {
    				set_style(div3, "width", /*x4*/ ctx[3] * 200 + 50 + "px");
    			}

    			if (!current || dirty & /*x3*/ 4) {
    				set_style(div4, "width", /*x3*/ ctx[2] * 200 + 50 + "px");
    			}

    			if (!current || dirty & /*x2*/ 2) {
    				set_style(div5, "width", sineOut(/*x2*/ ctx[1]) * 200 + 50 + "px");
    			}

    			if (!current || dirty & /*x1*/ 1) {
    				set_style(div6, "width", elasticOut(/*x1*/ ctx[0]) * 200 + 50 + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(playcontrols.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(playcontrols.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if (detaching) detach_dev(t12);
    			destroy_component(playcontrols, detaching);
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
    	const drv = animationDriver(0, 0);
    	let x1, x2, x3, x4, x5, x6, x7, x8, x9;

    	let cb1 = (t, u) => {
    		$$invalidate(0, x1 = springy.valueOf());
    	};

    	let springy = new drv.addAnimation(0, 2000, cb1);

    	let cb2 = (t, u) => {
    		$$invalidate(1, x2 = delay.slice(0, 0.5).valueOf());
    		$$invalidate(2, x3 = delay.slice(0, 0.5).steps(4).valueOf());
    		$$invalidate(3, x4 = delay.slice(0.5, 1).repeat(1.5).cycle().valueOf());
    	};

    	let delay = new drv.addAnimation(1000, 2000, cb2);

    	let cb3 = (t, u) => {
    		$$invalidate(4, x5 = key.slice(0, 0.4).valueOf());
    		$$invalidate(5, x6 = key.slice(0.3, 0.8).valueOf());
    		$$invalidate(6, x7 = key.slice(0.2, 0.5).valueOf());
    		$$invalidate(7, x8 = key.slice(0.41, 1).valueOf());
    		$$invalidate(8, x9 = key.slice(0.41, 0.9).valueOf());
    	};

    	let key = new drv.addAnimation(3000, 3000, cb3);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		PlayControls,
    		animationDriver,
    		sineOut,
    		elasticOut,
    		bounceOut,
    		drv,
    		x1,
    		x2,
    		x3,
    		x4,
    		x5,
    		x6,
    		x7,
    		x8,
    		x9,
    		cb1,
    		springy,
    		cb2,
    		delay,
    		cb3,
    		key
    	});

    	$$self.$inject_state = $$props => {
    		if ("x1" in $$props) $$invalidate(0, x1 = $$props.x1);
    		if ("x2" in $$props) $$invalidate(1, x2 = $$props.x2);
    		if ("x3" in $$props) $$invalidate(2, x3 = $$props.x3);
    		if ("x4" in $$props) $$invalidate(3, x4 = $$props.x4);
    		if ("x5" in $$props) $$invalidate(4, x5 = $$props.x5);
    		if ("x6" in $$props) $$invalidate(5, x6 = $$props.x6);
    		if ("x7" in $$props) $$invalidate(6, x7 = $$props.x7);
    		if ("x8" in $$props) $$invalidate(7, x8 = $$props.x8);
    		if ("x9" in $$props) $$invalidate(8, x9 = $$props.x9);
    		if ("cb1" in $$props) cb1 = $$props.cb1;
    		if ("springy" in $$props) springy = $$props.springy;
    		if ("cb2" in $$props) cb2 = $$props.cb2;
    		if ("delay" in $$props) delay = $$props.delay;
    		if ("cb3" in $$props) cb3 = $$props.cb3;
    		if ("key" in $$props) key = $$props.key;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [x1, x2, x3, x4, x5, x6, x7, x8, x9, drv];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({ target: document.body });

    return app;

}());
//# sourceMappingURL=bundle.js.map
