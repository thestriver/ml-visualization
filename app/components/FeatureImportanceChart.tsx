'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { FeatureData } from '../../types';

interface FeatureImportanceChartProps {
    data: FeatureData[];
    width?: number;
    height?: number;
}

export default function FeatureImportanceChart({
    data,
    width = 800,
    height = 500
}: FeatureImportanceChartProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [topN, setTopN] = useState<number>(10);
    const [view, setView] = useState<'bar' | 'parallel'>('bar');

    // Filter to top N features
    const filteredData = data.slice(0, topN);

    // Wrap render functions in useCallback
    const renderBarChart = useCallback(() => {
        if (!svgRef.current) return;

        // Set margins and dimensions
        const margin = { top: 20, right: 30, bottom: 60, left: 120 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create tooltip
        const tooltip = d3.select(tooltipRef.current);

        // Color scale for different feature categories
        const colorScale = d3.scaleOrdinal<string>()
            .domain(["numerical", "categorical", "textual"])
            .range(["#4e79a7", "#f28e2c", "#e15759"]);

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.importance) || 0])
            .range([0, innerWidth]);

        const yScale = d3.scaleBand()
            .domain(filteredData.map(d => d.feature))
            .range([0, innerHeight])
            .padding(0.2);

        // Add x-axis
        svg.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(5, ".0%"))
            .selectAll("text")
            .style("font-size", "12px");

        // Add x-axis label
        svg.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom / 2)
            .attr("text-anchor", "middle")
            .text("Feature Importance")
            .style("font-size", "14px");

        // Add y-axis
        svg.append("g")
            .call(d3.axisLeft(yScale))
            .selectAll("text")
            .style("font-size", "12px");

        // Create bars
        svg.selectAll(".bar")
            .data(filteredData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => yScale(d.feature) || 0)
            .attr("width", d => xScale(d.importance))
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(d.category))
            .on("mouseover", function (event, d) {
                d3.select(this).attr("opacity", 0.8);

                tooltip
                    .style("opacity", 1)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`)
                    .html(`
            <strong>${d.feature}</strong><br/>
            Importance: ${(d.importance * 100).toFixed(2)}%<br/>
            Type: ${d.category}
          `);
            })
            .on("mouseout", function () {
                d3.select(this).attr("opacity", 1);
                tooltip.style("opacity", 0);
            });

        // Add value labels
        svg.selectAll(".label")
            .data(filteredData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d.importance) + 5)
            .attr("y", d => (yScale(d.feature) || 0) + yScale.bandwidth() / 2 + 5)
            .text(d => (d.importance * 100).toFixed(1) + "%")
            .style("font-size", "12px");

        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${innerWidth - 120}, -10)`);

        const categories = ["numerical", "categorical", "textual"];

        categories.forEach((category, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            legendRow.append("rect")
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", colorScale(category));

            legendRow.append("text")
                .attr("x", 25)
                .attr("y", 12)
                .text(category)
                .style("font-size", "12px");
        });
    }, [filteredData, width, height]);

    const renderParallelCoordinates = useCallback(() => {
        if (!svgRef.current) return;

        // Set margins and dimensions
        const margin = { top: 50, right: 50, bottom: 60, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create tooltip
        const tooltip = d3.select(tooltipRef.current);

        // Color scale for different feature categories
        const colorScale = d3.scaleOrdinal<string>()
            .domain(["numerical", "categorical", "textual"])
            .range(["#4e79a7", "#f28e2c", "#e15759"]);

        // Create y scales for each dimension
        const yScales: { [key: string]: d3.ScaleLinear<number, number> } = {};

        // 3 dimensions: Feature Index, Importance, and Category
        yScales.index = d3.scaleLinear()
            .domain([0, filteredData.length - 1])
            .range([0, innerHeight]);

        yScales.importance = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.importance) || 0])
            .range([innerHeight, 0]);

        // For categorical scale - map categories to numbers
        const categories = Array.from(new Set(filteredData.map(d => d.category)));
        const categoryScale = d3.scalePoint()
            .domain(categories)
            .range([innerHeight, 0]);

        // Create x scale for dimensions
        const dimensions = ['Feature', 'Importance', 'Category'];
        const xScale = d3.scalePoint()
            .domain(dimensions)
            .range([0, innerWidth])
            .padding(0.1);

        // Add axes
        // Feature axis (left)
        const featureAxis = svg.append("g")
            .attr("transform", `translate(${xScale('Feature') || 0},0)`);

        featureAxis.append("text")
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .text("Feature")
            .style("font-size", "12px")
            .style("font-weight", "bold");

        filteredData.forEach((d, i) => {
            featureAxis.append("text")
                .attr("y", yScales.index(i))
                .attr("dy", "0.3em")
                .attr("text-anchor", "end")
                .attr("transform", `translate(-5,0)`)
                .text(d.feature)
                .style("font-size", "10px")
                .style("fill", colorScale(d.category));
        });

        // Importance axis (middle)
        const importanceAxis = svg.append("g")
            .attr("transform", `translate(${xScale('Importance') || 0},0)`)
            .call(d3.axisLeft(yScales.importance).ticks(5).tickFormat(d => `${(+d * 100).toFixed(0)}%`));

        importanceAxis.append("text")
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .text("Importance")
            .style("font-size", "12px")
            .style("font-weight", "bold");

        // Category axis (right)
        const categoryAxis = svg.append("g")
            .attr("transform", `translate(${xScale('Category') || 0},0)`);

        categoryAxis.append("text")
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .text("Category")
            .style("font-size", "12px")
            .style("font-weight", "bold");

        categories.forEach(category => {
            categoryAxis.append("text")
                .attr("y", categoryScale(category) || 0)
                .attr("dy", "0.3em")
                .attr("text-anchor", "start")
                .attr("transform", `translate(5,0)`)
                .text(category)
                .style("font-size", "10px")
                .style("fill", colorScale(category));
        });

        // Draw lines
        filteredData.forEach((d, i) => {
            const line = d3.line<[string, number]>()
                .x(p => xScale(p[0]) || 0)
                .y(p => {
                    if (p[0] === 'Feature') return yScales.index(i);
                    if (p[0] === 'Importance') return yScales.importance(d.importance);
                    if (p[0] === 'Category') return categoryScale(d.category) || 0;
                    return 0;
                });

            const points: [string, number][] = [
                ['Feature', i],
                ['Importance', d.importance],
                ['Category', categories.indexOf(d.category)]
            ];

            svg.append("path")
                .datum(points)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", colorScale(d.category))
                .attr("stroke-width", 1.5)
                .attr("opacity", 0.7)
                .on("mouseover", function (event) {
                    d3.select(this)
                        .attr("stroke-width", 3)
                        .attr("opacity", 1);

                    tooltip
                        .style("opacity", 1)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 28}px`)
                        .html(`
              <strong>${d.feature}</strong><br/>
              Importance: ${(d.importance * 100).toFixed(2)}%<br/>
              Type: ${d.category}
            `);
                })
                .on("mouseout", function () {
                    d3.select(this)
                        .attr("stroke-width", 1.5)
                        .attr("opacity", 0.7);

                    tooltip.style("opacity", 0);
                });
        });
    }, [filteredData, width, height]);

    useEffect(() => {
        if (!svgRef.current) return;

        d3.select(svgRef.current).selectAll("*").remove();

        if (view === 'bar') {
            renderBarChart();
        } else {
            renderParallelCoordinates();
        }
    }, [data, topN, view, renderBarChart, renderParallelCoordinates]);

    return (
        <div className="feature-importance-container">
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
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">useCallback</span>
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">d3-scale</span>
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">d3-axis</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Feature Importance Visualization</h2>
                <div className="flex items-center space-x-6">
                    <div className="relative">
                        <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span>View Type</span>
                        </label>
                        <div className="relative">
                            <select
                                aria-label="View Type"
                                value={view}
                                onChange={(e) => setView(e.target.value as 'bar' | 'parallel')}
                                className="appearance-none block w-48 px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                                         shadow-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 
                                         focus:border-blue-500 transition-colors duration-200"
                            >
                                <option value="bar">Bar Chart</option>
                                <option value="parallel">Parallel Coordinates</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span>Top Features</span>
                        </label>
                        <div className="relative">
                            <select
                                aria-label="Top Features"
                                value={topN}
                                onChange={(e) => setTopN(parseInt(e.target.value))}
                                className="appearance-none block w-48 px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                                         shadow-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                                         focus:border-blue-500 transition-colors duration-200"
                            >
                                <option value="5">Top 5</option>
                                <option value="10">Top 10</option>
                                <option value="15">Top 15</option>
                                <option value="20">All</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
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
                <h3 className="text-lg font-medium mb-2 text-blue-800">Feature Importance Analysis</h3>
                <p className="text-blue-700 mb-3">
                    This visualization shows which features have the most influence on the model&apos;s predictions. Higher values
                    indicate greater importance.
                </p>
                <ul className="list-disc pl-5 text-blue-700">
                    <li>Toggle between bar chart and parallel coordinates for different perspectives</li>
                    <li>Features are color-coded by type: numerical, categorical, or textual</li>
                    <li>Adjust the number of top features shown to focus on the most important ones</li>
                </ul>
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-blue-800">Technical Implementation Details</h3>
                <ul className="pl-5 list-disc space-y-1 text-blue-700">
                    <li>Dual visualization modes: Bar Chart and Parallel Coordinates</li>
                    <li>Optimized D3.js rendering with useCallback hooks</li>
                    <li>Interactive filtering system for top N features</li>
                    <li>Category-based color coding with dynamic legend</li>
                    <li>Responsive tooltips with detailed feature information</li>
                </ul>
            </div>
        </div>
    );
}