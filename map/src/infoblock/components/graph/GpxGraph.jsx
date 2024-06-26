import React, { useState } from 'react';
import RoadAttributesGraph from './RoadAttributesGraph';
import MainGraph from './MainGraph';
import andValues from '../../../../src/generated/android-values.json';
import { cap, UNDEFINED_DATA } from '../../../manager/GraphManager';

export default function GpxGraph({ mainData, attrGraphData, showData, width }) {
    const [selectedPoint, setSelectedPoint] = useState(null);

    function isEmptyAttrData(attrName) {
        return (
            attrGraphData[attrName].datasets.length < 2 &&
            attrGraphData[attrName].datasets[0]?.label === cap(UNDEFINED_DATA)
        );
    }

    function isBigData(attrName) {
        return attrGraphData[attrName].datasets.length > 500;
    }

    return (
        <>
            <MainGraph
                data={mainData}
                attrGraphData={attrGraphData}
                showData={showData}
                setSelectedPoint={setSelectedPoint}
                width={width}
            />
            {attrGraphData &&
                Object.keys(attrGraphData).map(
                    (attrName) =>
                        !isEmptyAttrData(attrName) &&
                        !isBigData(attrName) && (
                            <RoadAttributesGraph
                                key={attrName}
                                name={andValues[`routeInfo_${attrName}_name`]}
                                data={attrGraphData[attrName]}
                                width={width}
                                selectedPoint={selectedPoint}
                            />
                        )
                )}
        </>
    );
}
