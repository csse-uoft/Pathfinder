import {Button, Container, TextField, Typography} from "@mui/material";
import Dropdown from "../shared/fields/MultiSelectField";
import React, {useRef, useEffect, useState} from 'react';
import * as d3 from "d3";
import {sankey as d3Sankey, sankeyLinkHorizontal} from "d3-sankey";
import {fetchSankeyDiagramData} from "../../api/sankeyDiagramApi";
import {fetchOrganizations} from "../../api/organizationApi";
import SelectField from "../shared/fields/SelectField";
import {fetchDataTypeInterfaces} from "../../api/generalAPI";
import {Loading} from "../shared";
import GeneralField from "../shared/fields/GeneralField";
import {useSnackbar} from "notistack";
import {AlertDialog} from "../shared/dialogs/Dialogs";
import {parseInt} from "lodash/string";


export default function SankeyDiagram() {
  const [form, setForm] = useState({});
  const [data, setData] = useState({});
  const COLORS = ['#82ca9d', '#8884d8', '#ffc658', '#ff7300'];
  const [state, setState] = useState({
    loading: true,
    dialog: false,
    dialogTitle: '',
    dialogContext: ''
  });
  const [errors, setErrors] = useState(
    {}
  );
  const {enqueueSnackbar} = useSnackbar();
  const toBeDisabled = (id) => {
    if (id > 1) {
      if (!form[id - 1].dataType) {
        return true;
      }
    }
    return false;
  };
  // const dataTypes = ['Organization', 'Theme', 'Indicator'];

  const dataTypes = (id) => {
    if (id == 1)
      return ['Organization', 'Theme', 'Indicator']
    const prevDataType = form[id - 1]['dataType']
    switch (prevDataType) {
      case 'Organization':
        return ['Theme', 'Indicator']
      case 'Theme':
        return ['Organization', 'Indicator']
      case 'Indicator':
        return ['Theme', 'Organization']
      default:
        return []
    }
  }
  const [type2Individuals, setType2Individuals] = useState({
    'Organization': {}, 'Theme': {}, 'Indicator': {}
  });
  const SampData = {
    nodes: [
      { id: "A" },
      { id: "B" },
      { id: "C" },
    ],
    links: [
      { source: "A", target: "B", value: 10 }, // Incoming link to B
      { source: "B", target: "C", value: 15 }, // Outgoing link from B
    ],
  };

  // useEffect(() => {
  //   fetchOrganizations().then(res => {
  //     if (res.success) {
  //       res.organizations.map(organization => {
  //         organizationInterfaces[organization._uri] = organization.legalName;
  //       });
  //
  //     }
  //   }).then(
  //
  //   ).then().then(()=> {
  //     setState(state => ({...state, loading: false}));
  //   }).catch(e => {
  //     reportErrorToBackend(e);
  //     setState(state => ({...state, loading: false}));
  //     navigate('/dashboard');
  //     enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
  //   });
  // }, []);
  useEffect(() => {
    Promise.all([fetchOrganizations(), fetchDataTypeInterfaces('indicator'), fetchDataTypeInterfaces('theme')]).then(
      ([{organizations}, indicatorInterfaces, themeInterfaces]) => {
        const organizationInterfaces = {}
        organizations.map(organization => {
          organizationInterfaces[organization._uri] = organization.legalName;
        });
        setType2Individuals({
          'Organization': organizationInterfaces, 'Theme': themeInterfaces.interfaces, 'Indicator': indicatorInterfaces.interfaces
        })
        setState(state => ({...state, loading: false}));
      }
    );
  }, []);


  if (state.loading)
    return <Loading message={`Loading ...`}/>;
  return (
    <Container maxWidth="lg" sx={{marginBottom: 30}}>
      <Container
        sx={{
          width: "100%",
          // display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >

        <Typography
          variant="h5"
          style={{
            fontFamily: "Trade Gothic Next LT Pro Cn, sans-serif",
            fontSize: 35,
            fontWeight: "bold",
            color: "#0b2f4e",
          }}
        >
          Sankey Diagram
        </Typography>
        <GeneralField
          label="Number of Columns"
          type="number"
          onChange={(e) => {
            const newForm = {}
            for (let i = 1; i < parseInt(e.target.value, 10) + 1; i++) {
              if (form[i]) {
                newForm[i] = form[i]
              } else {
                newForm[i] = {dataType: '', individuals: []}
              }
            }
            setForm(newForm)
          }}
          // disabled={disabled}
        />
        {Object.keys(form).map((id) => {

          return (<div>
            <SelectField
              disabled={toBeDisabled(id)}
              key={'colType' + id}
              label={`Column ${id} data types`}
              value={form[id]['dataType']}
              options={dataTypes(id)}
              // helperText={}
              // onBlur={() => {
              //   if (!form.administrator) {
              //     setErrors(errors => ({...errors, administrator: 'This field cannot be empty'}));
              //   } else {
              //     setErrors(errors => ({...errors, administrator: ''}));
              //   }
              //
              // }}
              onChange={(e) => {
                // Create a new copy of the form object
                const updatedForm = {
                  ...form,
                  [id]: {
                    individuals: [],
                    dataType: e.target.value, // Update the specific field immutably
                  },
                };
                setForm(updatedForm); // Update state with the new object
              }}
            />


            <Dropdown
              chooseAll
              disabled={!form[id]['dataType']}
              key={'colInd' + id}
              label={`Column ${id} individuals`}
              value={form[id].individuals}
              options={type2Individuals[form[id]['dataType']] || {}}
              // error={!!errors.organizations}
              // helperText={
              //   errors.organizations
              // }
              onChange={(e) => {
                // Create a new copy of the form object
                const updatedForm = {
                  ...form,
                  [id]: {
                    ...form[id],
                    individuals: e.target.value, // Update the specific field immutably
                  },
                };
                setForm(updatedForm); // Update state with the new object
              }}
            />


          </div>);
        })}


        <Button
          size="lg"
          endDecorator={<>{">"}</>}
          onClick={async () => {

            try {
              const data = await fetchSankeyDiagramData(form);
              if (!data.error) {
                console.log(data.messages)
                if (data.messages)
                  setState(state => ({...state, dialog: true, dialogTitle: 'Warning', dialogContext: data.messages}))
                setData(data);
              } else {
                console.log(data.errorMessages)
                // enqueueSnackbar(data.errorMessages, {variant: 'error'});
                setState(state => ({...state, dialog: true, dialogTitle: 'Diagram cannot be generated', dialogContext: data.errorMessages}))
                setData({nodes: [], links: []})
              }

            } catch (e) {
              console.log(e)
            }



            // objectsCount.map(organization => organization.organization = organizationInterfaces[organization.organization])
            // setObjectsCount(objectsCount)
            // setOrganization2IndicatorCount(organization2IndicatorCount)
            // setTheme2OutcomesCount(theme2OutcomesCount)

          }
          }
          loadingPosition="start"
        >
          Generate Visualization
        </Button>
      </Container>
      {Object.keys(data).length ?
        <Container
          sx={{
            width: "100%",
            justifyContent: "center",
            marginTop: "20px",
          }}>
          <Diagram width={1000} height={900} data={data}/>


        </Container> : null
      }

      <AlertDialog
        dialogContentText={state.dialogContext}
        dialogTitle={state.dialogTitle}
        buttons={[
          <Button onClick={() => {
            setState(state => ({...state, dialog: false, dialogTitle: '', dialogContext: ''}));
            // window.location.reload();
          }}
                  key={'ok'}>{'ok'}</Button>
        ]}
        open={state.dialog}/>

    </Container>
  );
}


const Diagram = ({ width = 1000, height = 900, data }) => {
  const svgRef = useRef();
  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const labelPadding = 30; // Additional space for bottom labels
    const svgHeight = height + labelPadding;


    const sankey = d3Sankey()
      .nodeId(d => d.id)
      .nodeWidth(40)
      .nodePadding(40)
      .extent([[1, 1], [width - 1, height - labelPadding - 1]])
      .nodeAlign(node => (node.column !== undefined ? node.column : node.depth))
      .nodeSort(null);

    try {
      sankey(data);
    } catch (error) {
      console.error("Sankey layout error:", error);
      // enqueueSnackbar("Diagram cannot be generated", {variant: 'error'});
      return;
    }

    const nodeColor = d3.scaleOrdinal(d3.schemeCategory10);

    const defs = svg.append("defs");
    data.links.forEach((link, i) => {
      const gradientId = `gradient-${i}`;
      const gradient = defs.append("linearGradient")
        .attr("id", gradientId)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", link.source.x1)
        .attr("x2", link.target.x0)
        .attr("y1", link.source.y0 + (link.source.y1 - link.source.y0) / 2)
        .attr("y2", link.target.y0 + (link.target.y1 - link.target.y0) / 2);

      gradient.append("stop").attr("offset", "0%").attr("stop-color", "#6baed6");
      gradient.append("stop").attr("offset", "100%").attr("stop-color", "#2171b5");

      link.gradient = gradientId;
    });

    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(255, 255, 255, 0.9)")
      .style("color", "#000")
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("border", "1px solid #ccc")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Render links
    svg.append("g")
      .selectAll("path")
      .data(data.links)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("fill", "none")
      .attr("stroke", d => `url(#${d.gradient})`)
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("opacity", 0.9)
      .on("mouseover", function (event, d) {
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>Source:</strong> ${d.source.id}<br><strong>Target:</strong> ${d.target.id}<br><strong>Value:</strong> ${d.value}`
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });

    // Render nodes
    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .attr("transform", d => `translate(${d.x0}, ${d.y0})`);

    nodeGroup.append("rect")
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => nodeColor(d.id))
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .on("mouseover", function (event, d) {
        tooltip
          .style("opacity", 1)
          .html(`<strong>${d.id}</strong>`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });

    // Add node labels positioned under the nodes
    nodeGroup.append("text")
      .attr("x", d => {
        if (d.depth === 0) return -5; // Left alignment for left-most nodes
        if (d.depth === data.nodes.reduce((max, n) => Math.max(max, n.depth), 0)) return d.x1 - d.x0 + 5; // Right alignment for right-most nodes
        return (d.x1 - d.x0) / 2; // Center alignment for other nodes
      })
      .attr("y", d => d.y1 - d.y0 + 20) // Position below the node
      .attr("text-anchor", d => {
        if (d.depth === 0) return "start"; // Align left-most nodes to left
        if (d.depth === data.nodes.reduce((max, n) => Math.max(max, n.depth), 0)) return "end"; // Align right-most nodes to right
        return "middle"; // Center alignment for others
      })
      .attr("font-size", "13px")
      .attr("fill", "#000")
      .text(d => d.id);

  }, [data, width, height]);

  return <svg ref={svgRef} />;
};




