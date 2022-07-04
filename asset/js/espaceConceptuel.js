"use strict";
class espaceConceptuel {
    constructor(params) {
        var me = this;
        this.data = params.data ? params.data : {"children":[
            {"id": 1,"o:title": "vide", "value":1}
            ,{"id": 2,"o:title": "plein", "value":1}
        ]};
        this.cont = d3.select("#"+params.idCont);
        this.fontSize = params.fontSize ? params.fontSize : 18;
        this.height = params.height ? params.height : 600;
        this.width = params.width ? params.width : 600;
        this.id = params.id ? params.id : 0;
        var svg, container, color, hierarchie, cBand, hexbin;

        this.init = function () {

            this.cont.select('svg').remove();
            svg = this.cont.append("svg")
                .attr("width", me.width+'px').attr("height", me.height+'px');
            //création du conteneur pour le graph
            container = svg.append("g");                
            svg.call(
                d3.zoom()
                    .scaleExtent([.1, 4])
                    .on('zoom', (event) => {
                        container.attr('transform', event.transform);
                        })                        
            );
            let cKeys = me.data.children.map(d=>d.id);
            hierarchie = d3.hierarchy(me.data);

            cBand = d3.scaleBand()
                .domain(cKeys)
                .paddingInner(0.5) // edit the inner padding value in [0,1]
                .paddingOuter(0.5) // edit the outer padding value in [0,1]                
                .range([0, me.width])
                .align(0.5)
 
            let ec = container.selectAll('.ec').data(me.data.children).enter()
                    .append('g').attr('id',d=>'ec_'+me.id+'_'+d.id).attr('class','ec')
                .attr("transform", d => `translate(${cBand(d.id)+cBand.bandwidth()/2},${me.height/2})`)
                .on('click',clickEC);
            hexbin = d3.hexbin()
                .radius(cBand.bandwidth()/2);
            /*ajoute les intériorités
            actantG.append("ellipse")
                .attr('id',d=>'ActantEllipse_'+me.id+'_'+d.id)
                .attr('class','ActantEllipse')
                .attr('cx',d=>actantBand(d.id))
                .attr('cy',dimsBand('Concept')+dimsBand.bandwidth()/4)
                .attr('rx',d=>actantBand.bandwidth())
                .attr('ry',dimsBand.bandwidth()/1.5)
                .attr("stroke-width", 2)                
                .attr("stroke", d=>d.color)
                .attr("fill", d=>d.color)
                .attr('fill-opacity','0.3');
            */                                         
            //ajoute les hexagones
            ec.append("path")
                .attr('id',d=>'ecPath_'+me.id+'_'+d.id)
                .attr('class','ecPath')
                .attr("d", hexbin.hexagon())
                .attr("fill", d=>d.color ? d.color : 'green');
            //ajoute les titres
            ec.append("text")
                .attr('id',d=>'ecText_'+me.id+'_'+d.id)
                .attr('class','ecText')
                .selectAll("tspan")
                .data(d => d['o:title'].split(/(?=[A-Z][a-z])|\s+/g))
                .join("tspan")
                .attr("x", 0)
                .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
                .attr('text-anchor','middle')
                .text(d=>d);
            
    };

    function clickEC(e,d){
        console.log(d);
    }
    
    this.init();
    
    }
}

  
