import React from 'react';
import {useParams} from "react-router-dom";
import IndicatorView from "./IndicatorView";

export default function Indicator() {
  const {uri, viewMode} = useParams();
  return <IndicatorView  single uri={uri}/>
}