//un grand merci à https://www.redblobgames.com/grids/hexagons/
"use strict";
class cartoHexa {
    constructor(params) {
        var me = this;
        this.urlData = params.urlData ? params.urlData : false;
        this.urlDetails = params.urlDetails ? params.urlDetails : false;
        this.urlCooccurrence = params.urlCooccurrence ? params.urlCooccurrence : false;
        this.urlItems = params.urlItems ? params.urlItems : false;
        
        //this.urlPatience = params.urlPatience ? params.urlPatience : 'https://samszo.github.io/A_Maze_Logo/patience.html';
        this.urlPatience = params.urlPatience ? params.urlPatience : 'http://localhost/A_Maze_Logo/patience.html';        
        this.data = params.data ? params.data : {
            "o:id": 1,"o:title": "Carte exemple", "children":[
                {"o:id": 11,"o:title": "vide", "value":1, "children":[
                    {"o:id": 111,"o:title": "encore vide", "value":1}
                    ,{"o:id": 112,"o:title": "toujours plein","value":1}
            ]}
                ,{"o:id": 12,"o:title": "plein","value":10}
        ]};
        this.cont = d3.select("#"+params.idCont);
        this.fontSize = params.fontSize ? params.fontSize : 1;
        this.id = params.id ? params.id : 'ch0';
        this.planExtent = params.planExtent ? params.planExtent : 1;
        this.eventCreate = params.eventCreate ? params.eventCreate : 'click';
        this.eventDetails = params.eventDetails ? params.eventDetails : 'click';
        this.eventDetailsCooccurrence = params.eventDetailsCooccurrence ? params.eventDetailsCooccurrence : 'click';
        var layoutBase, rectCarto, padding = 0, width, height, legende,
        svg, rectBase, container, hierarchie, defText="vide", allHexa=[], takenHexa=[], color, defColor='black'
        , patience, defValSelect, valueExtent;

        this.init = function () {

            //initialisation
            this.cont.selectAll('div').remove();
            
            //création du div pour la légende
            let rectCont = this.cont.node().getBoundingClientRect() 
            //création du div pour la carte
            , divCarto = this.cont.append('div').attr('id','divCarto'+me.id)
                .style('height',rectCont.height+'px').style('width','70%').style('float','left')
            ; 
            //création du div pour la carto  
            legende = this.cont.append('div').attr('id','divLeg'+me.id)
                .style('height',rectCont.height+'px').style('width','30%')
                .style('background-color','white').style('float','left')

            //création du div pour la patience
            patience = this.cont.append('div').attr('id','divPatience'+me.id)
                .style('height','50%').style('width','50%')
                .style('background-color','black').style('display','none');                
            patience.append('iframe').attr('src',me.urlPatience)
                .style('position','absolute').style('top','50%').style('left','50%').style('transform','translate(-50%, -50%)')                
                .style('height','320px').style('width','206px').style('border','none').attr('scrolling','no')
                ;
            showHidePatience();

            //création du svg pour la carto
            rectCarto = divCarto.node().getBoundingClientRect(); 
            width = parseInt(rectCarto.width);
            height = parseInt(rectCarto.height);    
            svg = divCarto.append('svg')
                .attr('id','svgCartoHexa'+me.id)
                .attr('width',width).attr('height',height),
            container = svg.append("g");
            svg.call(
                d3.zoom()
                    //.scaleExtent([.1, planExtent])
                    .on('zoom', (event) => {
                        container.attr('transform', event.transform);
                        })                        
            );

            //ajoute les data
            if(me.urlData){
                d3.json(me.urlData).then(function(data) {
                    me.data = data;
                    initData();
                    showHidePatience();
                });            
            }else{
                initData();
                showHidePatience()
            } 
        };
        
    function showHidePatience(){
        if(patience.style('display')=='block')patience.style('display','none');
        else patience.style('display','block');
    }
    function initData() {
        hierarchie = d3.hierarchy(me.data);

        //définition des intervales
        valueExtent = d3.extent(me.data.children.map(d=>d.value));

        //définition des couleurs    
        color = d3.scaleSequential().domain(valueExtent).interpolator(d3.interpolateCool)

        //layout toujours flat pour garder un coté en relation avec le parent
        layoutBase = new Layout(Layout.flat, new Point(100, 100), new Point(0, 0));
        //initialise la cartographie suivant le nombre d'élément
        initHexa(me.planExtent);
            

        addTitle(hierarchie);
        //création de la légende
        createLegende();
        //création de la hiérachie des hexas
        //addChildren(hierarchie);ce lance à la création de la légende

    }


    function ExceptionCartoHexa(message) {
        this.message = message;
        this.name = "ExceptionCartoHexa";
     }    

     function createLegende() {

        let pad = 10;
        legende.append('h1').text('Légende').style('padding',pad+'px');
        
        createBrushVal();

        //ajoute la liste des docs
        legende.append('h2').text("Liste des ressources").style('padding',pad+'px')
            .append('div').attr('id',me.id+'ListeResource');
        
    }

    function showListeDoc(){
        let lr = d3.select('#'+me.id+'ListeResource');
        lr.selectAll('div').remove();
        lr.selectAll('div').data(data).enter().append('div').text(d=>d['o:title'])
    }

    function createBrushVal(){
        let margin = ({top: 20, right: 20, bottom: 30, left: 40})
        , data = d3.sort(Array.from(d3.group(me.data.children, d => d.value)).map(d=>{ return {'nb': d[1].length,'value':d[0]};}), d => d.value)
        , nbExtent = d3.extent(data, d=>d.nb)
        , rect = legende.node().getBoundingClientRect()
        , height=200 
        , focusHeight=height 
        , area = (x, y) => d3.area()
            .x(d => x(d.value))
            .y0(y(0.9))
            .y1(d => y(d.nb))
        /*
        , x = d3.scaleLinear()
            .domain(valueExtent)
            .range([margin.left, rect.width - margin.right])
        */
        , x = d3.scaleLog().base(2).domain(valueExtent).range([margin.left, rect.width - margin.right])
        , xAxis = (g, x, height, title) => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .call(g => g.selectAll(".title").data([title]).join("text")
                .attr("class", "title")
                .attr("x", margin.left)
                .attr("y", margin.bottom)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .text(title))            
        /*
        , y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.nb)])
            .range([height - margin.bottom, margin.top])
        */
        , y = d3.scaleLog().base(2).domain([0.9,nbExtent[1]]).range([height - margin.bottom, margin.top])
        , yAxis = (g, y, title) => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(d3.min([4,y.domain()[1]])))
            .call(g => g.selectAll(".title").data([title]).join("text")
                .attr("class", "title")
                .attr("x", 0)
                .attr("y", 10)
                .attr("fill", "currentColor")
                .attr("text-anchor", "middle")
                .text(title));

        const svg = legende.append("svg")
            .attr("viewBox", [0, 0, rect.width, height])
            .style("display", "block");
        const brush = d3.brushX()
            .extent([[margin.left, 0.5], [rect.width - margin.right, focusHeight - margin.bottom + 0.5]])
            .on("brush", brushed)
            .on("end", brushended);
        /*la sélection par défaut correspond à une étendu de 100
        let deb = valueExtent[1] > 100 ? valueExtent[1]/2-50 : valueExtent[0], 
            fin = valueExtent[1] > 100 ? valueExtent[1]/2+50 : valueExtent[1];        
        */
        //la sélection par défaut correspond à 1/4 des valeurs les plus grandes
        let sumNb = d3.sum(data, d=>d.nb)
            , deb = data[parseInt(data.length/4)].value
            , fin = valueExtent[1];        
        defValSelect = {'v':[deb, fin],'x':[x(deb), x(fin)]};

        svg.append('defs').append("linearGradient")
            .attr("id", "gradValue")
            //.attr("gradientUnits", "userSpaceOnUse")
            //.attr("x1", 0).attr("y1", 0)
            //.attr("x2", 0).attr("y2", 1)
        .selectAll("stop")
            .data(data.map((d,i)=>{return {'offset':(i*100/data.length)+"%", 'color': color(d.value)}}))
        .enter().append("stop")
            .attr("offset", function(d) { return d.offset; })
            .attr("stop-color", function(d) { return d.color; });

        svg.append("g")
            .call(xAxis, x, height,"Nombre d'usage de l'hexa");
        svg.append("g")
            .call(yAxis, y, 'nb Hexa');
        
        svg.append("path")
            .datum(data)
            .attr("fill", "url(#gradValue)")
            .attr("d", area(x, y));
        
        const gb = svg.append("g")
            .call(brush)
            .call(brush.move, defValSelect.x);
        
        function brushed({selection}) {
            if (selection) {
                let s = selection.map(x.invert, x);
                container.selectAll('.gHexa').attr('visibility',h=>{
                    if(!h.data)return 'visible';
                    return h.data.value >= s[0] && h.data.value <= s[1] ? 'visible' : 'hidden'
                });
            }
        }
        
        function brushended({selection}) {
            if (!selection) {
                gb.call(brush.move, defValSelect.x);
            }else{
                let s = selection.map(x.invert, x);
                /*initialise la grille
                takenHexa = [];
                container.selectAll('.gHexa').remove();
                */
                container.style("cursor", "wait");
                addChildren(hierarchie,s);
                container.style("cursor", "default");
            }
        }

    }

    function hexCenter(hex, layout) {        
        let p = layout.hexToPixel(hex),
        x = p.x, 
        y = p.y;
        return {
            'x': x,
            'y': y,
            transform: `translate(${x},${y})`,
            points:[x,y]
        }
    }
    function getViewBox(hexas) {
        let rect = hexSetBounds(layoutBase, hexas),
        left = rect.left - padding,
        top = rect.top - padding,
        width = rect.right - rect.left + 2 * padding,
        height = rect.bottom - rect.top + 2 * padding;
        return [left, top, width, height];
    }
    //création de la grille vide
    function initHexa(nbShape){
        while (allHexa.length < hierarchie.children.length) {
            allHexa = makeHexagonalShape(nbShape);
            nbShape ++;
        }
        me.planExtent = nbShape;
        let polygonVerticesFlat = layoutBase
            .polygonCorners(new Hex(0,0,0))
            .map(p=>`${p.x},${p.y}`)
            .join(" "),            
        vb = getViewBox(allHexa),
        scale = 1,
        svgHexa = container.append('svg')
            .attr('id','svgPlan0')
            .attr('width',vb[2]*scale).attr('height',vb[3]*scale)
            .attr('x',vb[0]*scale+width/2).attr('y',vb[1]*scale+height/2)
            .attr('viewBox',vb.join(' '))
            .selectAll('g').data(allHexa).enter().append('g')
            .attr('id',(h,i)=>{
                h.layout = layoutBase;
                h.subShapeDetail = 1;
                h.depth = 0;
                h.id = me.id+'gPlan'+h.depth+'_'+h.q+'_'+h.r+'_'+h.s;
                return h.id;
            })
            .attr('transform',h=>hexCenter(h,layoutBase).transform)
            .on(me.eventCreate,addHexa),
        polys = svgHexa.append('polygon').attr('points',polygonVerticesFlat)
                .attr('fill',defColor).attr('stroke','black')
                ;
        //ajouter les markers pour les rapports
        let markerBoxWidth = 20
            , markerBoxHeight = 20
            , refX = markerBoxWidth/2
            , refY = markerBoxHeight/2
            , arrowPoints = [[0, 0], [0, 20], [20, 10]]
            , defs = svgHexa.append('defs');
        defs.append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
            .attr('refX', refX)
            .attr('refY', refY)
            .attr('markerWidth', markerBoxWidth)
            .attr('markerHeight', markerBoxHeight)
            .attr('orient', 'auto-start-reverse')
            .append('path')
            .attr('d', d3.line()(arrowPoints))
            .attr('fill', '#ffffff32');        
        defs.append('marker')
            .attr('id', 'point')
            .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
            .attr('refX', refX)
            .attr('refY', refY)
            .attr('markerWidth', markerBoxWidth)
            .attr('markerHeight', markerBoxHeight)
            .attr('orient', 'auto')
            .append('circle')
            .attr('r', refX/2).attr('cx', refX).attr('cy', refY)
            .attr('fill', '#ffffff32');        
        
        return svgHexa;
    }
    //ajoute le titre de la carte
    function addTitle(d){

        let gCenter = svg.select('#'+me.id+'gPlan0_0_0_0').append('g')
            .attr('id',me.id+'gTitre')
        .attr('transform',hexCenter(new Hex(0,0,0), layoutBase).transform);
        gCenter.append("text")
            .attr('id',h=>{
                h.title = d.data['o:title'] ? d.data['o:title'] : defText; 
                d.layout = h.layout;
                d.subShapeDetail = h.subShapeDetail;
                d.id = h.id;
                return 'chText_'+me.id
            })
            .attr('text-anchor','middle')
            .attr('alignment-baseline',"middle")
            .text(h=>h.title)
            .attr('fill','white')
            .attr("font-size", function(){
                return (layoutBase.size.x / this.getComputedTextLength()) + 'em'
            });
        takenHexa['0_0_0_0']=gCenter;

    }
    //ajoute les efants d'un hexa
    function addChildren(d,s){
        if(!d.children)return;
        d.children.forEach(c=>{
            //vérifie que les données sont dans la sélection
            if(c.data.value >= s[0] && c.data.value <= s[1]){ 
                addChild(d, c);
            }
        })
    }

    function addChild(d, c){
        //vérifie si la donnée a une place
        let i = 1;
        while (c.q == undefined) {
            //récupère la première place disponible du centre vers l'extérieur
            hexRing(i).every(h=>{       
                let id = d.depth==0 ? me.id : d.id;
                id += 'gPlan'+d.depth+'_'+h.q+'_'+h.r+'_'+h.s;                
                if(!takenHexa[id]){
                    c.q = h.q;
                    c.r = h.r;
                    c.s = h.s;
                    c.title=c.data['o:title'];
                    c.id= id;
                    c.layout = d.layout;
                    c.subShapeDetail = 1;
                    return false;
                }
                return true
            })
            if(i > me.planExtent)throw new ExceptionCartoHexa("Plus de place disponible dans la carte");
            i++;
        }
        //création de l'hexa
        addHexa(null,c);
        //création des enfants
        let layout = new Layout(Layout.flat, new Point(c.layout.size.x/(c.subShapeDetail*2+1), c.layout.size.y/(c.subShapeDetail*2+1)), new Point(0, 0));
        c.layout = layout; 
        addChildren(c,[0,me.data.children.length]);
        return c;
        
    }

    //ajoute un hexagone
    function addHexa(e,hp){
        if(hp.q == 0 && hp.r == 0 && hp.r == 0)return;
        if(takenHexa[hp.id])return;

        let hexas = makeHexagonalShape(hp.subShapeDetail),
        layout = new Layout(Layout.flat, new Point(hp.layout.size.x/(hp.subShapeDetail*2+1), hp.layout.size.y/(hp.subShapeDetail*2+1)), new Point(0, 0)),
        polygonVerticesFlat = layout
            .polygonCorners(new Hex(0,0,0))
            .map(p=>`${p.x},${p.y}`)
            .join(" "),            
        s = svg.select('#'+hp.id), //n = s.node(), bb = n.getBBox(),
        gHexa = s.selectAll('g').data(hexas).enter().append('g')
            .attr('class','gHexa')
            .attr('id',(h,i)=>{
                h.data = hp.data;
                h.subShapeDetail = hp.subShapeDetail;
                h.layout =layout;                
                h.depth = e ? hp.depth+1 : hp.depth;//gestion ajout manuel ou data
                h.id = hp.id+'gPlan'+h.depth+'_'+h.q+'_'+h.r+'_'+h.s;    
                return h.id;
            })
            .attr('transform',h=>{
                return hexCenter(h, layout).transform
            })
            .on(me.eventDetails ,getDetails)
            .on("mouseenter", zoomHexa)
            .on("mouseleave", dezoomHexa)
            ,
        polys = gHexa.append('polygon').attr('points',polygonVerticesFlat)
                .attr('fill',h=>{
                    let c = color(hp.data ? hp.data.value : 1);
                    if(h.q == 0 && h.r == 0 && h.r == 0) h.color = d3.color(c).copy({opacity: 0.8});
                    else h.color = d3.color(c).copy({opacity: 0.5});
                    return h.color
                })
                .attr('stroke','black').attr('stroke-width',h=>1/h.depth/10)
                .style('cursor', h=>h.q == 0 && h.r == 0 && h.r == 0 ? 'pointer' : 'zoom-in')
                .on('click',clickHex);
        //le centre est réserver à la description de l'espace
        /*        ,
        center = gHexa.append('circle').attr('x',0).attr('y',0).attr('r',10)
                .attr('fill','green').attr('stroke','black')
                .on('mouseover',addHexa);
        */        
        //ajoute les titres
        gHexa.append("text")
            .attr('id',h=>{
                if(h.q == 0 && h.r == 0 && h.r == 0)
                    h.title = hp.title ? hp.title : defText; 
                else h.title = "";
                return 'chText_'+h.id
            })
            /*
            .selectAll("tspan")
            .data(d => d.title.split(/(?=[A-Z][a-z])|\s+/g))
            .join("tspan")
            .attr("x", 0)
            .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
            */
            .attr('text-anchor','middle')
            .attr('alignment-baseline',"middle")
            .text(h=>h.title)
            .attr("font-size", adaptLabelFontSize)
            ;
        
        takenHexa[hp.id]=gHexa;

    }
    function adaptLabelFontSize(d) {
        /*
            * The meaning of the ratio between labelAvailableWidth and labelWidth equaling 1 is that
            * the label is taking up exactly its available space.
            * With the result as `1em` the font remains the same.
            *
            * The meaning of the ratio between labelAvailableWidth and labelWidth equaling 0.5 is that
            * the label is taking up twice its available space.
            * With the result as `0.5em` the font will change to half its original size.
            */
        return (d.layout.size.x / this.getComputedTextLength()) + 'em';
    } 

    function zoomHexa(e,d){        
        if(d.q == 0 && d.r == 0 && d.r == 0 && d.layout){
            d3.select(this.parentNode).raise();
            d3.select(this).raise().attr('transform','scale(10)');
        }
    }
    function dezoomHexa(e,d){
        if(d.q == 0 && d.r == 0 && d.r == 0 && d.layout)d3.select(this).attr('transform',hexCenter(d, d.layout).transform);
    }

    function getDetails(e,d){
        if(!d.details){
            if(me.urlDetails && d.data && d.q == 0 && d.r == 0 && d.r == 0){
                let h = d3.select(this);
                h.style('cursor','wait');
                d3.json(me.urlDetails+d.data["o:id"]).then(function(data) {
                    d.details = data;
                    if(me.urlCooccurrence){
                        d3.json(me.urlCooccurrence+d.data["o:id"]).then(function(data) {
                            d.cooccurrences = data;
                            showCooccurrences(d);
                        });                    
                    }
                    h.style('cursor','pointer');
                    showDetails(d);
                });            
            }
        }else{
            if(d.showDetails){
                hideDetails(d);
                hideCooccurrences(d);    
            }else{
                showDetails(d);
                showCooccurrences(d);    
            }
        }

    }
    function showDetails(d){
        d3.select('#'+d.id).select('polygon').attr('stroke','white').attr('stroke-width', d.depth)
        d.showDetails = true;
    }
    function hideDetails(d){
        d3.select('#'+d.id).attr('stroke','black').attr('stroke-width', 1/d.depth/10)
        d.showDetails = false;
    }
    function hideCooccurrences(d){
        container.selectAll('.cooccurrences'+d.data["o:id"]).remove();
    }
    function showCooccurrences(d){      
        //gestion du zoom
        let contTrans = container.attr('transform');
        container.attr('transform','');
        let links = d.cooccurrences.filter(c=>{
                if(c.id==d.data["o:id"])return false;
                c.hexaTarget = getHexaFromId(c.id);
                c.hexa = d;
                c.resources = c.idsR.split(',');
                return c.hexaTarget;
                })
            , extent = d3.extent(links,l=>l.nbValue)
            , rapportWidth = d3.scaleLinear()
                .domain(extent)
                .range([1, d.layout.size.x])
            , bbT, bb = d3.select('#'+d.id).node().getBoundingClientRect()
            ,rapports = container.selectAll('.cooccurrences'+d.data["o:id"])
                .data(links)
                .enter().append('g')
                    .attr('class','cooccurrences'+d.data["o:id"])
                    .attr('id',r=>{
                        bbT = d3.select('#'+r.hexaTarget.id).node().getBoundingClientRect();
                        r.points = [
                            [bb.x+bb.width/2,bb.y+bb.height/2],
                            [bbT.x+bbT.width/2,bbT.y+bbT.height/2]
                        ]
                        return 'rapport'+d.data["o:id"]+'_'+r.id;
                    })
                    .on(me.eventDetailsCooccurrence,showDetailsCooccurrences)
                    .style('cursor','pointer')
                    ;
        rapports.append('path')
            .attr('d', r=>d3.line()(r.points))
            .attr('stroke', '#ffffff32')
            .attr('stroke-width', r=>rapportWidth(r.nbValue))
            //.attr('marker-start', 'url(#point')
            .attr('marker-end', 'url(#point)')
            .attr('stroke-linecap',"round")
            .attr('fill', 'none');
        
        container.attr('transform', contTrans);        
    }
    function showDetailsCooccurrences(e,d){
        //récupère la liste des ressources
        if(me.urlItems){
            d3.json(me.urlItems+'&ids[]='+d.resources.join('&ids[]=')).then(function(data) {
                d.items = data;
                console.log(data);
            });                    
        }
    }
    function getHexaFromId(id){
        let hexa = hierarchie.find(h=>{
            return h.data['o:id']==id
        });
        if(hexa){
            if(hexa.layout)return hexa;
            else{
                return false;
                //hexa.layout = layoutBase
                //return addChild(hexa.parent,hexa);
            } 
        }else{
            //throw new ExceptionCartoHexa("L'hexagone n'existe pas dans la carte");
            console.log("L'hexagone n'existe pas dans la carte : "+id);
            return false;
        } 

    }
    function updateHexa(e,d){
        console.log(d);
    }
    function clickHex(e,h){
        if(h.q == 0 && h.r == 0 && h.r == 0) updateHexa(e,h);
        else addHexa(e,h);
    }

    
    this.init();
    
    }
}

  
