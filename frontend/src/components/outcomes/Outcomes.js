import React from 'react';
import {useParams} from "react-router-dom";
import OutcomeView from "./OutcomeView";
export default function Outcomes() {
  const {uri} = useParams();
  return <OutcomeView organizationUri={uri} multi/>
}
