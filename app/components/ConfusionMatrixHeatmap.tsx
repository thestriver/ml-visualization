'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ConfusionMatrixData } from '../../types';

interface ConfusionMatrixHeatmapProps {
    data: ConfusionMatrixData;
    width?: number;
    height?: number;
}

export default function ConfusionMatrixHeatmap({
    data,
    width = 800,
    height = 600
}: ConfusionMatrixHeatmapProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [normalized, setNormalized] = useState<boolean>(true);

    useEffect(() => {
        if (!svgRef.current) return;

        // Clear previous rendering
        d3.select(svgRef.current).selectAll("*").remove();

        // Set margins and dimensions
        const margin = { top: 40, right: 50, bottom: 50, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Get matrix data
        const { matrix, labels } = data;
        const n = labels.length;

        // Prepare normalized matrix if needed
        const displayMatrix = normalized
            ? matrix.map(row => {
                const sum = row.reduce((acc, val) => acc + val, 0);
                return row.map(val => (val / sum) * 100);
            })
            : matrix;

        // Create color scale
        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, normalized ? 100 : Math.max(...matrix.flat())]);

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create tooltip
        const tooltip = d3.select(tooltipRef.current);

        // Create scales
        const xScale = d3.scaleBand()
            .domain(labels)
            .range([0, innerWidth])
            .padding(0.05);

        const yScale = d3.scaleBand()
            .domain(labels)
            .range([0, innerHeight])
            .padding(0.05);

        // Add x-axis
        svg.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");

        // Add y-axis
        svg.append("g")
            .call(d3.axisLeft(yScale));

        // Add axis labels
        svg.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom - 5)
            .attr("text-anchor", "middle")
            .text("Predicted Class")
            .style("font-size", "14px");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -margin.left + 15)
            .attr("text-anchor", "middle")
            .text("Actual Class")
            .style("font-size", "14px");

        // Add title
        svg.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Confusion Matrix");

        // Create heatmap cells
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const actualClass = labels[i];
                const predictedClass = labels[j];
                const value = displayMatrix[i][j];
                const rawValue = matrix[i][j];

                svg.append("rect")
                    .attr("x", xScale(predictedClass) || 0)
                    .attr("y", yScale(actualClass) || 0)
                    .attr("width", xScale.bandwidth())
                    .attr("height", yScale.bandwidth())
                    .style("fill", colorScale(value))
                    .style("stroke", "white")
                    .style("stroke-width", 1)
                    .on("mouseover", function (event) {
                        d3.select(this)
                            .style("stroke", "#333")
                            .style("stroke-width", 2);

                        tooltip
                            .style("opacity", 1)
                            .style("left", `${event.pageX + 10}px`)
                            .style("top", `${event.pageY - 28}px`)
                            .html(`
                <strong>Actual: ${actualClass}</strong><br/>
                <strong>Predicted: ${predictedClass}</strong><br/>
                Count: ${rawValue}<br/>
                ${normalized ? `Percentage: ${value.toFixed(1)}%` : ''}
                ${i === j ? '<br/><span class="text-green-600 font-medium">Correct Prediction</span>' :
                                    '<br/><span class="text-red-600 font-medium">Incorrect Prediction</span>'}
              `);
                    })
                    .on("mouseout", function () {
                        d3.select(this)
                            .style("stroke", "white")
                            .style("stroke-width", 1);

                        tooltip.style("opacity", 0);
                    });

                // Add text labels to cells
                svg.append("text")
                    .attr("x", (xScale(predictedClass) || 0) + xScale.bandwidth() / 2)
                    .attr("y", (yScale(actualClass) || 0) + yScale.bandwidth() / 2)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .text(normalized ? `${value.toFixed(0)}%` : value)
                    .style("font-size", "12px")
                    .style("fill", value > (normalized ? 50 : Math.max(...matrix.flat()) / 2) ? "white" : "black");
            }
        }

        // Add color legend
        const legendWidth = 20;
        const legendHeight = innerHeight;

        // Create color scale for legend
        const legendScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, normalized ? 100 : Math.max(...matrix.flat())]);

        // Create gradient
        const defs = svg.append("defs");

        const gradient = defs.append("linearGradient")
            .attr("id", "confusion-matrix-gradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "0%");

        // Add color stops
        const stops = 10;
        for (let i = 0; i <= stops; i++) {
            const offset = i / stops;
            const value = normalized ? offset * 100 : offset * Math.max(...matrix.flat());

            gradient.append("stop")
                .attr("offset", `${offset * 100}%`)
                .attr("stop-color", legendScale(value));
        }

        // Draw legend rectangle
        svg.append("rect")
            .attr("x", innerWidth + 10)
            .attr("y", 0)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#confusion-matrix-gradient)");

        // Add legend axis
        const legendAxis = d3.scaleLinear()
            .domain([0, normalized ? 100 : Math.max(...matrix.flat())])
            .range([legendHeight, 0]);

        svg.append("g")
            .attr("transform", `translate(${innerWidth + 10 + legendWidth}, 0)`)
            .call(d3.axisRight(legendAxis).ticks(5).tickFormat(d => normalized ? `${d}%` : `${d}`));

        // Add legend title
        svg.append("text")
            .attr("transform", "rotate(90)")
            .attr("x", legendHeight / 2)
            .attr("y", -innerWidth - 35)
            .attr("text-anchor", "middle")
            .text(normalized ? "Percentage" : "Count")
            .style("font-size", "12px");

    }, [data, normalized, width, height]);

    return (
        <div className="confusion-matrix-container">
            <div className="flex flex-col space-y-4">

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 text-blue-800 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-semibold">Technical Stack</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">D3.js</span>
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">d3-scale</span>
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">d3-axis</span>
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">d3-interpolate</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Confusion Matrix Heatmap</h2>

                <div className="flex items-center">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={normalized}
                                onChange={() => setNormalized(!normalized)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                                          peer-focus:ring-blue-300 rounded-full peer 
                                          peer-checked:after:translate-x-full peer-checked:after:border-white 
                                          after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                          after:bg-white after:border-gray-300 after:border after:rounded-full 
                                          after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                            ></div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                Show normalized values (%)
                            </span>
                        </div>
                    </label>
                </div>
            </div>

            <div className="relative">
                <svg ref={svgRef}></svg>
                <div
                    ref={tooltipRef}
                    className="absolute opacity-0 bg-white border border-gray-200 p-2 rounded shadow-md pointer-events-none text-sm transition-opacity duration-200"
                    style={{ maxWidth: '200px' }}
                ></div>
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-blue-800">Confusion Matrix Analysis</h3>
                <p className="text-blue-700 mb-3">
                    This heatmap shows how well the model distinguishes between different classes. The darker cells along
                    the diagonal represent correct predictions, while off-diagonal cells represent misclassifications.
                </p>
                <ul className="list-disc pl-5 text-blue-700">
                    <li>High values along the diagonal indicate good class-specific accuracy</li>
                    <li>Bright off-diagonal cells reveal common misclassifications</li>
                    <li>Toggle between raw counts and percentages to see different perspectives</li>
                </ul>
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-blue-800">Technical Implementation Details</h3>
                <ul className="pl-5 list-disc space-y-1 text-blue-700">
                    <li>Interactive D3.js heatmap with dynamic color scaling</li>
                    <li>Custom tooltip system showing detailed cell information</li>
                    <li>Toggle between raw counts and normalized percentages</li>
                    <li>Responsive gradient legend with dynamic scale</li>
                    <li>Optimized rendering with proper cleanup on unmount</li>
                </ul>
            </div>
        </div>
    );
}