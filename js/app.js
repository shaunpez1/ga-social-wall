$(document).foundation().ready(function(){

  // Declare Variables
  var $mainTemplate = $(".main");

  // Setup Route
  var route = Router({
    "/social-wall" : socialWallCtrl,
    "/social-moderate": socialModerateCtrl,
    "/social-data" : socialDataCtrl

  }).init("/social-wall");

  // Switch to moderate
  $(document).on("click", ".nav .success", function(e){
    e.preventDefault();
    route.setRoute("social-moderate");
    window.location.reload();
  });

  // Switch to data page
  $(document).on("click", ".nav .secondary", function(e){
    e.preventDefault();
    route.setRoute("/social-data");
    window.location.reload();
  });

  // Switch to wall
  $(document).on("click", ".nav .info", function(e){
    e.preventDefault();
    route.setRoute("/social-wall");
    window.location.reload();
  });

  // Setup helper handle bar function
  Handlebars.registerHelper('if_eq', function(a, b, opts) {
    if (a == b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
  });

  function socialWallCtrl(){
    // Create Template
    var source = $("#social-template").html();
    var socialTemplate = Handlebars.compile(source);

    // Declare Firebase approved
    var ref = new Firebase("https://social-posts.firebaseio.com/approved");

    $mainTemplate.html("");

    // If new approved post then dispaly
    ref.limitToLast(20).on('value', function(results){
      var keys = Object.keys(results.val()).reverse();
      var reverse_results = [];
      // REverse results for
      for(var i = 0; i < keys.length; i++)
      {
          reverse_results.push(results.val()[keys[i]]);
      }

      $mainTemplate.html(socialTemplate({ posts : reverse_results }));

      var $socialGrid = $('#social-grid');
      var $grid = $(".post");
      $grid.hide();

      $socialGrid.imagesLoaded( function() {
        $grid.fadeIn();

        $socialGrid.masonry({
          itemSelector: '.post',
          fitWidth: true,
          gutter: 6
        });
      });
    });

  }


  function socialModerateCtrl(){
      // Create Template
    var source = $("#social-moderate-template").html();
    var socialModerateTemplate = Handlebars.compile(source);

    // Declare Firebase approved
    var ref = new Firebase("https://social-posts.firebaseio.com/");


    // Get list from oracle SRM
    $.ajax({
      type : "GET",
      url : "https://socialaggregate.cpn.live.vitrue.com/tabs/27270/campaigns/dd915654-1c55-4300-a50f-bac6a2959a34/data?results=15",
      success : function(social_posts){

        ref.child("all").child("post_ids").on('value', function(results){
          var approvedPosts = social_posts;
          var ids = results.val();

          $.each( social_posts, function( key, post ) {
              $.each( ids, function( id_key, id ) {
                  if(post.social_post.id == id.post_id){
                    delete approvedPosts[key];
                  }
              });
          });
          console.log(approvedPosts);

          $mainTemplate.html(socialModerateTemplate(approvedPosts !== undefined ? { posts : approvedPosts } : ""));
        });

      },
      error : function(){
        alert("Social moderation cannot be displayed");

      }
    });

    // Mood select
    $(document).on("click", ".mood i", function(e){
      e.preventDefault();
      $(this).closest(".mood").find("i").removeClass('selected');
      $(this).addClass('selected');
    });

    // Approve Post
    $(document).on("submit", ".social-post-item", function(e){
      var $mood = $(this).find(".post-moderate .selected").attr("data-name");
      var $imageSrc = $(this).find(".post-image img").attr("src");

      if($mood !== undefined){
        var data = {
          id : $(this).find(".approval .success").attr("data-id"),
          post_text : $(this).find(".post-message").html(),
          post_type : $(this).find(".post-details i").attr("data-name"),
          profile_pic : $(this).find(".post-user img").attr("src"),
          tags : $(this).find(".post-tags").html(),
          uname : $(this).find(".post-user span").html(),
          mood : $mood
        }
        if($imageSrc !== undefined){
          data.imgfull = $imageSrc;
        }

        ref.child("approved").push(data);
        ref.child("all").child(data.mood).push({ mood : data.mood });
        ref.child("all").child("post_ids").push({ post_id : data.id });

        $("#p-" + data.id).slideUp("normal", function() { $(this).remove(); } );

      }else{
        alert("Please select a mood");
      }
      e.preventDefault();
    });

    // Decline Post
    $(document).on("click", ".social-post-item .alert", function(e){
      var id = $(this).attr("data-id");
      var mood = $(this).closest(".social-post-item").find(".post-moderate .selected").attr("data-name");

      if(mood !== undefined){
        ref.child("declined").push({ post_id : id });
        ref.child("all").child(mood).push({ mood : mood });
        ref.child("all").child("post_ids").push({ post_id : id });

        $("#p-" + id).slideUp("normal", function() { $(this).remove(); } );
      }else{
        alert("Please select a mood");
      }

      e.preventDefault();
    });
  }

  function socialDataCtrl(){
    // Create Template
    var source = $("#social-data-template").html();
    var socialDataTemplate = Handlebars.compile(source);

    // Create page content
    $mainTemplate.html(socialDataTemplate());

    // Assign Graphs
    var $barGraph= $("#bar-graph");
    var $pieChart = $("#pie-chart");

    // Declare Firebase approved
    var ref = new Firebase("https://social-posts.firebaseio.com/");

    ref.child("all").on('value', function(results){
      var mood = [Object.keys(results.val().happy).length, Object.keys(results.val().neutral).length, Object.keys(results.val().sad).length];

      var myBarGraph = new Chart($barGraph, {
          type: 'bar',
          data: {
              labels: ["Positive", "Neutral", "Negative"],
              datasets: [{
                  label: '# of Posts',
                  data: mood
              }]
          },
          options: {
              scales: {
                  yAxes: [{
                      ticks: {
                          beginAtZero:true
                      }
                  }]
              }
          }
      });

      var myDoughnutChart = new Chart($pieChart, {
          type: 'doughnut',
          data: {
              labels: [
                  "Positive",
                  "Neutral",
                  "Negative"
              ],
              datasets: [
                  {
                      data: mood,
                      backgroundColor: [
                          "#36A2EB",
                          "#FFCE56",
                          "#FF6384"
                      ],
                      hoverBackgroundColor: [
                          "#36A2EB",
                          "#FFCE56",
                          "#FF6384"

                      ]
                  }]
          },
          options: {}
      });
    });
  }




});
