import React from 'react';

import StakeholderView from "./StakeholderView";
import {useParams} from "react-router-dom";

export default function Stakeholder() {
    const {uri, viewMode} = useParams();
    return <StakeholderView  single uri={uri}/>
}