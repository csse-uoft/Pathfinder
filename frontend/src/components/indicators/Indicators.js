import React from 'react';
import {useParams} from "react-router-dom";
import IndicatorView from "./IndicatorView";
export default function Indicators() {
  const {uri, viewMode} = useParams();

  return <IndicatorView  multi organizationUri={uri}/>
}