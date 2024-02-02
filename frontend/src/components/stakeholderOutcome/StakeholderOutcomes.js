import React from 'react';

import {useParams} from "react-router-dom";

import StakeholderOutcomeView from "./StakeholderOutcomeView";
export default function StakeholderOutcomes() {

  const {uri} = useParams();
  return <StakeholderOutcomeView multi organizationUri={uri}/>

}