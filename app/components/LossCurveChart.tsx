'use client';

import { useState } from 'react';
import { LinePath } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { Group } from '@visx/group';
import { Tooltip, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';
import { LossDataPoint } from '../../types';
import { curveMonotoneX } from '@visx/curve';

interface LossCurveChartProps {
    data: LossDataPoint[];
    width?: number;
    height?: number;
}

// Define bisector for finding closest point
const bisectEpoch = bisector<LossDataPoint, number>((d) => d.epoch).left;

export default function LossCurveChart({ data, width = 800, height = 500 }: LossCurveChartProps) {
    const [tooltipData, setTooltipData] = useState<LossDataPoint | null>(null);
    const [tooltipLeft, setTooltipLeft] = useState<number | null>(null);
    const [tooltipTop, setTooltipTop] = useState<number | null>(null);

    // Chart margins
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };

    // Dimensions
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Scales
    const xScale = scaleLinear<number>({
        domain: [1, Math.max(...data.map(d => d.epoch))],
        range: [0, innerWidth],
        nice: true
    });

    const yScale = scaleLinear<number>({
        domain: [0, Math.max(...data.flatMap(d => [d.trainLoss, d.valLoss])) * 1.1],
        range: [innerHeight, 0],
        nice: true
    });

    // Tooltip handler
    const handleTooltip = (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
        const { x } = localPoint(event) || { x: 0 };
        const x0 = xScale.invert(x - margin.left);
        const index = bisectEpoch(data, x0, 1);
        const d0 = data[index - 1];
        const d1 = data[index];
        let d = d0;

        // Find the closer point
        if (d1 && d0) {
            d = x0 - d0.epoch > d1.epoch - x0 ? d1 : d0;
        }

        setTooltipData(d);
        setTooltipLeft(xScale(d.epoch) + margin.left);
        setTooltipTop(Math.min(yScale(d.trainLoss), yScale(d.valLoss)) + margin.top - 20);
    };

    return (
        <div className="loss-curve-container">
            <div className="flex flex-col space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">Training & Validation Loss</h2>

                {/* Compact Technical Stack Card */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 text-blue-800 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-semibold">Technical Stack</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">@visx/shape</span>
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">@visx/scale</span>
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">@visx/tooltip</span>
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">d3-array</span>
                    </div>
                </div>
            </div>

            <div className="relative">
                <svg width={width} height={height}>
                    <Group left={margin.left} top={margin.top}>
                        {/* Grids */}
                        <GridRows
                            scale={yScale}
                            width={innerWidth}
                            strokeDasharray="3,3"
                            stroke="#e0e0e0"
                        />
                        <GridColumns
                            scale={xScale}
                            height={innerHeight}
                            strokeDasharray="3,3"
                            stroke="#e0e0e0"
                        />

                        {/* Axes */}
                        <AxisLeft
                            scale={yScale}
                            label="Loss"
                            labelProps={{
                                fontSize: 14,
                                textAnchor: 'middle',
                                dx: -40
                            }}
                            tickLabelProps={() => ({
                                fontSize: 12,
                                textAnchor: 'end',
                                dx: -4,
                                dy: 4
                            })}
                        />
                        <AxisBottom
                            top={innerHeight}
                            scale={xScale}
                            label="Epoch"
                            labelProps={{
                                fontSize: 14,
                                textAnchor: 'middle',
                                dy: 40
                            }}
                            tickLabelProps={() => ({
                                fontSize: 12,
                                textAnchor: 'middle',
                                dy: 4
                            })}
                        />

                        {/* Training loss line */}
                        <LinePath
                            data={data}
                            x={d => xScale(d.epoch)}
                            y={d => yScale(d.trainLoss)}
                            stroke="#3182ce" // blue
                            strokeWidth={2}
                            curve={curveMonotoneX}
                        />

                        {/* Validation loss line */}
                        <LinePath
                            data={data}
                            x={d => xScale(d.epoch)}
                            y={d => yScale(d.valLoss)}
                            stroke="#e53e3e" // red
                            strokeWidth={2}
                            curve={curveMonotoneX}
                        />

                        {/* Tooltip trigger area */}
                        <rect
                            width={innerWidth}
                            height={innerHeight}
                            fill="transparent"
                            onMouseMove={handleTooltip}
                            onMouseLeave={() => {
                                setTooltipData(null);
                                setTooltipLeft(null);
                                setTooltipTop(null);
                            }}
                        />

                        {/* Tooltip vertical line */}
                        {tooltipData && (
                            <line
                                x1={xScale(tooltipData.epoch)}
                                x2={xScale(tooltipData.epoch)}
                                y1={0}
                                y2={innerHeight}
                                stroke="#718096"
                                strokeWidth={1}
                                strokeDasharray="4,4"
                                pointerEvents="none"
                            />
                        )}
                    </Group>
                </svg>

                {/* Tooltip */}
                {tooltipData && tooltipLeft != null && tooltipTop != null && (
                    <Tooltip
                        top={tooltipTop}
                        left={tooltipLeft}
                        style={{
                            ...defaultStyles,
                            backgroundColor: 'white',
                            color: 'black',
                            border: '1px solid #ccc',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                            padding: '0.5rem',
                            pointerEvents: 'none'
                        }}
                    >
                        <div className="text-sm">
                            <div className="font-bold">Epoch {tooltipData.epoch}</div>
                            <div className="flex items-center mt-1">
                                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                <div>Train Loss: {tooltipData.trainLoss.toFixed(4)}</div>
                            </div>
                            <div className="flex items-center mt-1">
                                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                <div>Val Loss: {tooltipData.valLoss.toFixed(4)}</div>
                            </div>
                        </div>
                    </Tooltip>
                )}
            </div>

            {/* Legend */}
            <div className="flex justify-center mt-4 space-x-6">
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 mr-2"></div>
                    <span>Training Loss</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 mr-2"></div>
                    <span>Validation Loss</span>
                </div>
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-blue-800">Loss Curve Analysis</h3>
                <p className="text-blue-700">
                    This chart shows how the model&apos;s loss decreases during training. The training loss typically decreases
                    steadily, while the validation loss may plateau or increase if the model begins to overfit.
                    The ideal scenario is when both curves converge to a low loss value.
                </p>
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-blue-800">Technical Implementation Details</h3>
                <ul className="pl-5 list-disc space-y-1 text-blue-700">
                    <li>Built with Visx for optimized React-based visualization</li>
                    <li>Interactive tooltip system with bisector-based point detection</li>
                    <li>Smooth curve interpolation using monotoneX</li>
                    <li>Responsive grid system with customizable axes</li>
                    <li>Dynamic scaling with automatic domain adjustment</li>
                </ul>
            </div>
        </div>
    );
}