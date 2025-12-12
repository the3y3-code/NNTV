import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

/**
 * ArchitectureCanvas.jsx
 * 
 * Renders a dynamic visualization of the neural network topology using D3.js.
 * Features:
 * 1. Network Graph: Neurons and connections laid out by layer.
 * 2. Live Input: Shows the actual image being processed (left side).
 * 3. Live Output: Shows the probability bars for each class (right side).
 * 4. Signal Flow: Animates colored particles with trails traveling through the network.
 */
const ArchitectureCanvas = ({ config, weights, isTraining }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const neuronsRef = useRef([]); // Store neuron positions for animation
    const layersRef = useRef([]);  // Store layer sizes
    const geometryRef = useRef({ width: 0, height: 0, margin: { left: 30, right: 30, top: 20, bottom: 20 } });

    // State to track container size and force re-renders on resize
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

    // --- Effect 0: Robust Sizing Strategy ---
    React.useLayoutEffect(() => {
        const updateDims = () => {
            if (!containerRef.current) return;
            const { width, height } = containerRef.current.getBoundingClientRect();
            setDimensions(prev => {
                // Debounce/Check equality to prevent loops
                if (Math.abs(prev.width - width) < 2 && Math.abs(prev.height - height) < 2) return prev;
                return { width, height };
            });
        };

        // 1. Immediate measure
        updateDims();

        // 2. ResizeObserver
        const resizeObserver = new ResizeObserver(() => {
            // Wrap in requestAnimationFrame to avoid "ResizeObserver loop limit exceeded"
            requestAnimationFrame(updateDims);
        });
        if (containerRef.current) resizeObserver.observe(containerRef.current);

        // 3. Window Resize Fallback
        window.addEventListener('resize', updateDims);

        // 4. Safety Polling (Catches flexbox settling)
        const pollInterval = setInterval(updateDims, 100);
        const timer = setTimeout(() => clearInterval(pollInterval), 1000); // Stop polling after 1s

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateDims);
            clearInterval(pollInterval);
            clearTimeout(timer);
        };
    }, []);

    // --- Effect 1: Draw Static Graph Topology ---
    useEffect(() => {
        if (!svgRef.current || !config || dimensions.width === 0) return;

        const { width, height } = dimensions;

        // Reduced margins for "Wider" look
        const margin = { left: 30, right: 30, top: 20, bottom: 20 };
        const graphWidth = width - margin.left - margin.right;
        const graphHeight = height - margin.top - margin.bottom;

        geometryRef.current = { width, height, margin };

        // Reset SVG
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);

        // Main group for the network graph
        const g = svg.append("g")
            .attr("class", "graph-group")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Placeholder groups for input/output visualizations
        svg.append("g").attr("class", "input-group");
        svg.append("g").attr("class", "output-group");

        // Determine topology
        const getLayerSizes = () => {
            if (config.architecture === 'mlp') return [20, 16, 12, 10];
            if (config.architecture === 'lenet') return [20, 18, 16, 12, 10];
            if (config.architecture === 'resnet') return [16, 14, 14, 14, 12, 12, 12, 12, 10, 10, 10, 10, 8, 8, 10];
            return [20, 16, 12, 10];
        };

        const layers = getLayerSizes();
        layersRef.current = layers;

        const layerSpacing = graphWidth / (layers.length - 1 || 1);

        // --- Calculate Neuron Positions ---
        const neurons = [];
        layers.forEach((count, lIndex) => {
            const x = lIndex * layerSpacing;
            const ySpacing = graphHeight / (count + 1);
            for (let i = 0; i < count; i++) {
                neurons.push({
                    id: `l${lIndex}_n${i}`,
                    layer: lIndex,
                    index: i,
                    x: x,
                    y: (i + 1) * ySpacing
                });
            }
        });
        neuronsRef.current = neurons;

        // --- Draw Connections ---
        layers.forEach((count, lIndex) => {
            if (lIndex === layers.length - 1) return;
            const nextCount = layers[lIndex + 1];
            for (let i = 0; i < count; i++) {
                for (let j = 0; j < nextCount; j++) {
                    const source = neurons.find(n => n.layer === lIndex && n.index === i);
                    const target = neurons.find(n => n.layer === lIndex + 1 && n.index === j);

                    g.append("line")
                        .attr("x1", source.x)
                        .attr("y1", source.y)
                        .attr("x2", target.x)
                        .attr("y2", target.y)
                        .attr("stroke", "#555")
                        .attr("stroke-width", 1)
                        .attr("opacity", 0.1)
                        .attr("class", `link l${lIndex}-l${lIndex + 1}`);
                }
            }
        });

        // --- Draw Neurons ---
        g.selectAll("circle.neuron")
            .data(neurons)
            .enter()
            .append("circle")
            .attr("class", "neuron")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 6)
            .attr("fill", d => d.layer === 0 ? "#4fc3f7" : d.layer === layers.length - 1 ? "#ffeb3b" : "#ccc")
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 2);

    }, [config, dimensions]); // Re-run when config or size changes

    // --- Effect 2: Live Data Updates ---
    useEffect(() => {
        if (!svgRef.current || !weights || dimensions.width === 0) return;

        const svg = d3.select(svgRef.current);
        const { width, height, margin } = geometryRef.current;
        const graphHeight = height - margin.top - margin.bottom;

        // 1. Draw Input Image (Left)
        const inputGroup = svg.select(".input-group");
        if (weights.sample_input) {
            let img = inputGroup.select("image");
            if (img.empty()) {
                img = inputGroup.append("image")
                    .attr("x", 10)
                    .attr("y", height / 2 - 28)
                    .attr("width", 56)
                    .attr("height", 56)
                    .attr("opacity", 0)
                    .style("image-rendering", "pixelated");

                img.transition().duration(500).attr("opacity", 1);

                inputGroup.append("text")
                    .attr("x", 38)
                    .attr("y", height / 2 + 45)
                    .attr("text-anchor", "middle")
                    .attr("fill", "#ccc")
                    .attr("font-size", "10px")
                    .text("Input");
            }
            img.attr("href", weights.sample_input);
        }

        // 2. Draw Output Probability Bars (Right)
        const outputGroup = svg.select(".output-group");
        // Ensure group is positioned correctly even after resize/render
        outputGroup.attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);
        // Ensure label exists
        if (outputGroup.select("text").empty()) {
            outputGroup.append("text")
                .attr("x", 30)
                .attr("y", -5)
                .attr("text-anchor", "middle")
                .attr("fill", "#ccc")
                .attr("font-size", "10px")
                .text("Pred");
        }

        if (weights.sample_output) {
            const maxBarWidth = 60;
            const bars = outputGroup.selectAll("rect").data(weights.sample_output);

            bars.enter()
                .append("rect")
                .attr("x", 0)
                .attr("y", (d, i) => (i + 1) * (graphHeight / 11) - 5)
                .attr("height", 10)
                .attr("fill", "#38bdf8")
                .attr("opacity", 0.8)
                .merge(bars)
                .transition().duration(200)
                .attr("width", d => d * maxBarWidth)
                .attr("fill", d => d > 0.5 ? "#4ade80" : "#38bdf8");

            const labels = outputGroup.selectAll(".label-text").data(weights.sample_output);
            labels.enter()
                .append("text")
                .attr("class", "label-text")
                .attr("x", -5)
                .attr("y", (d, i) => (i + 1) * (graphHeight / 11) + 4)
                .attr("text-anchor", "end")
                .attr("fill", "#fff")
                .attr("font-size", "10px")
                .text((d, i) => i);
        }

    }, [weights, dimensions]); // Re-run if weights update OR size changes


    // --- Effect 3: Signal Flow Animation ---
    // Controlled by 'isTraining' prop.
    useEffect(() => {
        if (!svgRef.current || !config || !isTraining || dimensions.width === 0) return;

        const g = d3.select(svgRef.current).select(".graph-group");
        if (g.empty()) return;

        const neurons = neuronsRef.current;
        const layers = layersRef.current;
        const signalColors = ["#ef4444", "#e879f9", "#818cf8", "#38bdf8", "#4ade80", "#fbbf24"];

        const animateParticle = () => {
            if (neurons.length === 0) return;

            const startLayer = 0;
            const startNodeIndex = Math.floor(Math.random() * layers[startLayer]);
            const startNode = neurons.find(n => n.layer === startLayer && n.index === startNodeIndex);
            if (!startNode) return;

            const color = signalColors[Math.floor(Math.random() * signalColors.length)];

            // Create Particle
            const particle = g.append("circle")
                .attr("r", 3)
                .attr("fill", color)
                .attr("cx", startNode.x)
                .attr("cy", startNode.y)
                .attr("opacity", 1);

            let currentLayer = 0;
            const step = () => {
                if (currentLayer >= layers.length - 1) {
                    particle.remove();
                    return;
                }

                const nextNodes = neurons.filter(n => n.layer === currentLayer + 1);
                const randomNext = nextNodes[Math.floor(Math.random() * nextNodes.length)];

                // Get current position (could be previous node)
                const currentNode = neurons.find(n => n.layer === currentLayer &&
                    // This is an approximation since we don't track exact path, but 
                    // for the line drawing we use the particle's current known coords
                    Math.abs(n.x - parseFloat(particle.attr("cx"))) < 1 &&
                    Math.abs(n.y - parseFloat(particle.attr("cy"))) < 1
                ) || { x: parseFloat(particle.attr("cx")), y: parseFloat(particle.attr("cy")) };

                // Draw Trail (Line)
                const trail = g.append("line")
                    .attr("x1", currentNode.x)
                    .attr("y1", currentNode.y)
                    .attr("x2", currentNode.x) // Start at same point
                    .attr("y2", currentNode.y)
                    .attr("stroke", color)
                    .attr("stroke-width", 2)
                    .attr("opacity", 1);

                // Animate Trail Extending to Next Node
                trail.transition()
                    .duration(400)
                    .ease(d3.easeLinear)
                    .attr("x2", randomNext.x)
                    .attr("y2", randomNext.y)
                    .on("end", () => {
                        // Fade out trail
                        trail.transition().duration(200).attr("opacity", 0).remove();
                    });

                // Move Particle
                particle.transition()
                    .duration(400)
                    .ease(d3.easeLinear)
                    .attr("cx", randomNext.x)
                    .attr("cy", randomNext.y)
                    .on("end", () => {
                        currentLayer++;
                        step();
                    });
            };
            step();
        };

        const interval = setInterval(() => {
            if (document.hidden) return;
            animateParticle();
        }, 200);

        return () => clearInterval(interval);
    }, [isTraining, dimensions]); // Re-start animation if resizing happens

    return (
        <div className="arch-canvas" ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }}></svg>
            <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: '12px', color: '#666' }}>
                Visualization of signal propagation
            </div>
        </div>
    );
};

export default ArchitectureCanvas;
