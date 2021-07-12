window.addEventListener("DOMContentLoaded", () => {
    const corpoPage = document.querySelector('#corpoObligationsPage');
    if (corpoPage) {

        //transform data
        let temp = tempData.map(({date, value}) => ({
            date: new Date(date).getTime() / 1000, value
        }))
        let data = temp;

        //graph sizes
        const graphHolder = document.querySelector('.graphHolder');
        const graphHeight = graphHolder.getBoundingClientRect().height;
        const graphWidth = graphHolder.getBoundingClientRect().width;

        // set the dimensions and margins of the graph
        const margin = {top: 40, right: 40, bottom: 40, left: 40},
            width = graphWidth - margin.left - margin.right,
            height = graphHeight - margin.top - margin.bottom;


        /*-----------
            D3 functions
        -----------*/

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)]).nice()
            .range([height - margin.bottom, margin.top])

        const x = d3.scaleUtc()
            .domain(d3.extent(data, d => d.date))
            .range([margin.left, width - margin.right])

        const line = d3.line()
            .defined(d => !isNaN(d.value))
            .x(d => x(d.date))
            .y(d => y(d.value))

        const xAxis = g => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))

        const yAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.select(".domain").remove())
            .call(g => g.select(".tick:last-of-type text").clone()
                .attr("x", 3)
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text(data.y))


        /*----------
            tooltip functions
        ----------*/
        const callout = (g, value) => {
            if (!value) return g.style("display", "none");

            g
                .style("display", null)
                .style("pointer-events", "none")
                .style("font", "10px sans-serif");

            const path = g.selectAll("path")
                .data([null])
                .join("path")
                .attr("fill", "white")
                .attr("stroke", "black");

            const text = g.selectAll("text")
                .data([null])
                .join("text")
                .call(text => text
                    .selectAll("tspan")
                    .data((value + "").split(/\n/))
                    .join("tspan")
                    .attr("x", 0)
                    .attr("y", (d, i) => `${i * 1.1}em`)
                    .style("font-weight", (_, i) => i ? null : "bold")
                    .text(d => d));

            const {x, y, width: w, height: h} = text.node().getBBox();

            text.attr("transform", `translate(${-w / 2},${15 - y})`);
            path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
        }

        function formatValue(value) {
            return value.toLocaleString("en", {
                style: "currency",
                currency: "USD"
            });
        }

        function formatDate(date) {
            return date.toLocaleString("en", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC"
            });
        }

        function bisect(mx) {
            const bisect = d3.bisector(d => d.date).left;
            const date = x.invert(mx);
            const index = bisect(data, date, 1);
            const a = data[index - 1];
            const b = data[index];
            return b && (date - a.date > b.date - date) ? b : a;
        }


        const chart = () => {
            const svg = d3.create("svg")
                .attr("viewBox", [0, 0, width, height])
                .style("-webkit-tap-highlight-color", "transparent")
                .style("overflow", "visible");

            svg.append("g")
                .attr("class", "myXaxis")
                .call(xAxis);

            svg.append("g")
                .attr("class", "myYaxis")
                .call(yAxis);

            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("class", "line")
                .attr("stroke", "#C0A26B")
                .attr("stroke-width", 1)
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("d", line);

            /*----------
                tooltip
            ----------*/
            const tooltip = svg.append("g");

            svg.on("touchmove mousemove", function (event) {
                const {date, value} = bisect(d3.pointer(event, this)[0]);
                tooltip
                    .attr("transform", `translate(${x(date)},${y(value)})`)
                    .call(callout, `${formatValue(value)} ${formatDate(date)}`);
            });


            svg.on("touchend mouseleave", () => tooltip.call(callout, null));


            //--------------
            //UPDATE DATA
            //--------------

            document.querySelector('#cert').addEventListener('click', () => {
                console.log('update');
                data = tempData.map(({date, value}) => ({
                    date: new Date(date).getTime() / 1000, value
                }))

                // Create the X axis:
                x.domain([0, d3.max(data, function (d) {
                    return d.date
                })]);
                svg.selectAll(".myXaxis").transition()
                    .duration(3000)
                    .call(xAxis);
                //
                // // create the Y axis
                y.domain([0, d3.max(data, function (d) {
                    return d.value
                })]);
                svg.selectAll(".myYaxis")
                    .transition()
                    .duration(3000)
                    .call(yAxis);

                // // Create a update selection: bind to the new data
                var u = svg.selectAll("path")
                    .data([data], function (d) {
                        return d.date
                    });
                //
                // // Updata the line
                u
                    .enter()
                    .append("path")
                    .attr("class","line")
                    .merge(u)
                    .transition()
                    .duration(3000)
                    .attr("d", d3.line()
                        .x(function(d) { return x(d.date); })
                        .y(function(d) { return y(d.value); }))
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1)


            });


            document.querySelector('#back').addEventListener('click', () => {
                console.log('update');
                data = temp.slice(0, 100);

                // Create the X axis:
                x.domain([0, d3.max(data, function (d) {
                    return d.date
                })]);
                svg.selectAll(".myXaxis").transition()
                    .duration(3000)
                    .call(xAxis);
                //
                // // create the Y axis
                y.domain([0, d3.max(data, function (d) {
                    return d.value
                })]);
                svg.selectAll(".myYaxis")
                    .transition()
                    .duration(3000)
                    .call(yAxis);

                // // Create a update selection: bind to the new data
                var u = svg.selectAll("path")
                    .data([data], function (d) {
                        return d.date
                    });
                //
                // // Updata the line
                u
                    .enter()
                    .append("path")
                    .attr("class","line")
                    .merge(u)
                    .transition()
                    .duration(3000)
                    .attr("d", d3.line()
                        .x(function(d) { return x(d.date); })
                        .y(function(d) { return y(d.value); }))
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1)


            })


            //return graph
            return svg.node();
        }


        //add Chart to DOM
        document.querySelector('.graphHolder').appendChild(chart())

    }
})
