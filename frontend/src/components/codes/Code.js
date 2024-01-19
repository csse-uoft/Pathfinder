import React from 'react';

import CodeView from "./CodeView";
import {useParams} from "react-router-dom";

export default function Code() {
    const {uri, viewMode} = useParams();
    return <CodeView  single uri={uri}/>
}