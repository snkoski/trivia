import { Question } from '../../../packages/shared/dist';

const getAudioUrl = (filename: string) => {
  return `https://pub-3e59ba9f7b4a44c0b35848cd99378892.r2.dev/${filename}`;
};

const allNames = [
  'Alborz',
  'Alec H',
  'Ailcia',
  'Andres Margendie',
  'Bedi',
  'Ben Soer',
  'Brandon Burkhard',
  'Cherry',
  'Darryl',
  'Dustin',
  'Jacob Wessa',
  'Jerry',
  'Justin Crumley',
  'Lino',
  'Marco Fernandez',
  'Marcus Alley',
  'Matt Iakhno',
  'Michele Davis',
  'Raiyan',
  'Randy Douglas',
  'Robert Koomjian',
  'Sam',
  'shawn',
  'Susannah',
  'Tiago',
  'Vince',
  'Wenqi Wang'
];

export const mockQuestions: Question[] = [
  {
    id: 1,
    question: 'Blues Will Never Die by Mike Griffin and The Unknown Blues Band',
    audioUrl: getAudioUrl('blues_will_never_die__Mike_griffin.m4a'),
    options: allNames,
    correctAnswer: allNames.indexOf('Vince')
  },
  {
    id: 2,
    question: 'CSS Suxxx by CSS',
    audioUrl: getAudioUrl('css_suxxx_css.m4a'),
    options: allNames,
    correctAnswer: allNames.indexOf('Ailcia')
  },
  {
    id: 3,
    question: 'Funk Docta by TVBOO, Big Gigantic, and ProbCause',
    audioUrl: getAudioUrl('funk_docta__tvboo__big_gigantic__probcause.m4a'),
    options: allNames,
    correctAnswer: allNames.indexOf('Ben Soer')
  },
  {
    id: 4,
    question: 'I Thought You Didn\'t Even Like Leaving by Prince Daddy and the Hyena',
    audioUrl: getAudioUrl('i_thought_you_didnt_even_like_leaving__prince_daddy_and_the_hyena.m4a'),
    options: allNames,
    correctAnswer: allNames.indexOf('shawn')
  },
  {
    id: 5,
    question: 'I\'m My Own Grandpa by Willie Nelson',
    audioUrl: getAudioUrl('im_my_own_grandpa__willie_nelson.m4a'),
    options: allNames,
    correctAnswer: allNames.indexOf('Darryl')
  },
  {
    id: 6,
    question: 'Loretta by Ginger Root',
    audioUrl: getAudioUrl('loretta__ginger_root.m4a'),
    options: allNames,
    correctAnswer: allNames.indexOf('Robert Koomjian')
  },
  {
    id: 7,
    question: 'Summer\'s Gone by The Beach Boys',
    audioUrl: getAudioUrl('summers_gone__the_beach_boys.m4a'),
    options: allNames,
    correctAnswer: allNames.indexOf('Dustin')
  },
  {
    id: 8,
    question: 'You & Me by MEUTE',
    audioUrl: getAudioUrl('you_and_me__meute.m4a'),
    options: allNames,
    correctAnswer: allNames.indexOf('Tiago')
  }
];
