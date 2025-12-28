import { InvestigationData } from '@/types/investigation';

export const investigationData: InvestigationData = {
  title: 'UCLA Encampment: A Visual Investigation',
  description: 'A detailed timeline of events during the Pro-Palestine demonstrations at UCLA',
  maxWidth: '700px', // Max width for content area
  startTime: '4:00:00', // Global timeline start time
  endTime: '24:00:00', // Global timeline end time
  events: [
    {
      id: 'encampment-setup',
      startTime: '4:10:07',
      endTime: '8:17:59',
      title: 'Encampment Setup',
      description: 'Students begin setting up tents and organizing the encampment area on campus.',
      videoOptions: {
        oddVideoFirst: false,
        oddVideoSameSize: true,
      },
      clips: [
        { url: '/videos/day_one/timelapse/royce_west/compressed_1-setup_royce_west.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/powell_west/compressed_1-setup_powell_west.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/royce_east/compressed_1-setup_royce_east.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/powell_east/compressed_1-setup_powell_east.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/flagpole/compressed_1-setup_flagpole.mp4', cropBlackBars: false },
      ],
      subEvents: [
        {
          type: 'text',
          content: 'In the early hours of the morning, dedicated students began arriving on campus to set up the encampment. Tents were pitched, supplies were organized, and the atmosphere was charged with anticipation for the day ahead.'
        },
        {
          type: 'map',
          imagePath: '/images/ucla-satellite.png',
          duration: 500,
          markers: [
            {
              x: 41.5,
              y: 41,
              shape: 'semicircle',
              direction: 180,
              radius: 80,
              fieldOfView: 170,
              appearAt: 0.35,
              disappearAt: 0.95,
              size: 10
            },
            {
              x: 41.5,
              y: 41,
              shape: 'square',
              appearAt: 0.35,
              disappearAt: 0.95,
              size: 20
            },
            {
              x: 41.5,
              y: 56,
              shape: 'semicircle',
              direction: 0,
              radius: 80,
              fieldOfView: 170,
              appearAt: 0.35,
              disappearAt: 0.95,
              size: 10
            },
            {
              x: 41.5,
              y: 56,
              shape: 'square',
              appearAt: 0.35,
              disappearAt: 0.95,
              size: 20
            },
            {
              x: 61,
              y: 41,
              shape: 'semicircle',
              direction: 180,
              radius: 80,
              fieldOfView: 170,
              appearAt: 0.35,
              disappearAt: 0.95,
              size: 10
            },
            {
              x: 61,
              y: 41,
              shape: 'square',
              appearAt: 0.35,
              disappearAt: 0.95,
              size: 20
            },
            {
              x: 61,
              y: 56,
              shape: 'semicircle',
              direction: 0,
              radius: 80,
              fieldOfView: 170,
              appearAt: 0.35,
              disappearAt: 0.95,
              size: 10
            },
            {
              x: 61,
              y: 56,
              shape: 'square',
              appearAt: 0.35,
              disappearAt: 0.95,
              size: 20
            },
            {
              x: 78,
              y: 60,
              shape: 'semicircle',
              direction: 30,
              radius: 120,
              fieldOfView: 40,
              appearAt: 0.35,
              disappearAt: 0.95,
              size: 10
            },
            {
              x: 78,
              y: 60,
              shape: 'square',
              appearAt: 0.35,
              disappearAt: 0.95,
              size: 20
            }
          ],
          labels: [
            {
              x: 50,
              y: 30,
              text: 'There are five main camera locations capturing the encampment setup',
              appearAt: 0.3,
              disappearAt: 0.7
            },
            {
              x: 50,
              y: 65,
              text: 'Each capturing the full scope of the encampment',
              appearAt: 0.3,
              disappearAt: 0.7
            },
          ]
        },
        {
          type: 'text',
          content: 'In the early hours of the morning, dedicated students began arriving on campus to set up the encampment. Tents were pitched, supplies were organized, and the atmosphere was charged with anticipation for the day ahead.'
        },
      ]
    },
    {
      id: 'encampment-public',
      startTime: '8:17:59',
      endTime: '11:45:53',
      title: 'Encampment Public',
      description: 'Students begin setting up tents and organizing the encampment area on campus.',
      videoOptions: {
        oddVideoFirst: false,
        oddVideoSameSize: true,
      },
      clips: [
        { url: '/videos/day_one/timelapse/royce_west/compressed_2-public_royce_west.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/powell_west/compressed_2-public_powell_west.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/royce_east/compressed_2-public_royce_east.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/powell_east/compressed_2-public_powell_east.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/flagpole/compressed_2-public_flagpole.mp4', cropBlackBars: false },
      ],
      subEvents: [
        {
          type: 'collage',
          photos: [
            {
              imagePath: '/images/start-collage/pse-image.jpeg',
              imageAlt: 'Scene 1',
              caption: 'Morning setup',
              attribution: 'Photo by Reddot'
            },
            {
              imagePath: '/images/start-collage/db-1.jpg',
              imageAlt: 'Scene 2',
              attribution: 'Photo by Jane Doe / Daily Bruin'
            },
            {
              imagePath: '/images/start-collage/db-2.jpg',
              imageAlt: 'Scene 2',
              attribution: 'Photo by Jane Doe / Daily Bruin'
            }
          ],
        },
      ]
    },
    {
      id: 'encampment-closed',
      startTime: '11:45:53',
      endTime: '14:04:54',
      title: 'Encampment Closed',
      description: 'Students begin setting up tents and organizing the encampment area on campus.',
      videoOptions: {
        oddVideoFirst: false,
        oddVideoSameSize: true,
      },
      clips: [
        { url: '/videos/day_one/timelapse/royce_west/compressed_3-closed_royce_west.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/powell_west/compressed_3-closed_powell_west.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/royce_east/compressed_3-closed_royce_east.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/powell_east/compressed_3-closed_powell_east.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/flagpole/compressed_3-closed_flagpole.mp4', cropBlackBars: false },
      ]
    },
    {
      id: 'encampment-expands',
      startTime: '14:04:54',
      endTime: '17:14:22',
      title: 'Encampment Expands',
      description: 'Students begin setting up tents and organizing the encampment area on campus.',
      videoOptions: {
        oddVideoFirst: false,
        oddVideoSameSize: true,
      },
      clips: [
        { url: '/videos/day_one/timelapse/royce_west/compressed_4-expand_royce_west.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/powell_west/compressed_4-expand_powell_west.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/royce_east/compressed_4-expand_royce_east.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/powell_east/compressed_4-expand_powell_east.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/flagpole/compressed_4-expand_flagpole.mp4', cropBlackBars: false },
      ]
    },
    {
      id: 'counterprotester-first-rally',
      startTime: '17:14:22',
      endTime: '21:14:32:00',
      title: 'Encampment Counterprotester First Rally',
      description: 'Students begin setting up tents and organizing the encampment area on campus.',
      videoOptions: {
        oddVideoFirst: false,
        oddVideoSameSize: true,
      },
      clips: [
        { url: '/videos/day_one/timelapse/royce_west/compressed_5-counterprotesters_royce_west.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/powell_west/compressed_5-counterprotesters_powell_west.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/royce_east/compressed_5-counterprotesters_royce_east.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/powell_east/compressed_5-counterprotesters_powell_east.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/flagpole/compressed_5-counterprotesters_flagpole.mp4', cropBlackBars: false },
      ]
    },
    {
      id: 'first-night',
      startTime: '21:14:32',
      endTime: '24:00:00',
      title: 'Encampment First Night',
      description: 'Students begin setting up tents and organizing the encampment area on campus.',
      videoOptions: {
        oddVideoFirst: false,
        oddVideoSameSize: true,
      },
      clips: [
        { url: '/videos/day_one/timelapse/royce_west/compressed_6-nighttime_royce_west.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/powell_west/compressed_6-nighttime_powell_west.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/royce_east/compressed_6-nighttime_royce_east.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/powell_east/compressed_6-nighttime_powell_east.mp4', cropBlackBars: true },
        { url: '/videos/day_one/timelapse/flagpole/compressed_6-nighttime_flagpole.mp4', cropBlackBars: false },
      ]
    }
  ]
};
