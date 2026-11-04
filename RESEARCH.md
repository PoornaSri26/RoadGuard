# RoadGuardian – Research References

This document compiles research references, repositories, and datasets relevant to the RoadGuardian project.

**Project:** [manikantad24-web/Road-Safety](https://github.com/manikantad24-web/Road-Safety) (RoadGuardian, Team X_Coder)
**Last Updated:** 4 Nov 2026

---

## 1. GitHub Repositories

### Road Damage Detection

| Repo | Description |
|---|---|
| [oracl4/RoadDamageDetection](https://github.com/oracl4/RoadDamageDetection) | YOLOv8 trained on RDD2022, Streamlit demo, PascalVOC→YOLOv8 conversion |
| [sekilab/RoadDamageDetector](https://github.com/sekilab/RoadDamageDetector) | Official RDD datasets (2018/2019/2020/2022), challenge news, baseline models |
| [ultralytics/ultralytics](https://github.com/ultralytics/ultralytics) | YOLOv8 / YOLO11 framework (AGPL-3.0) |
| [Jyothismaria/Pothole_Detection_Classification](https://github.com/Jyothismaria/Pothole_Detection_Classification) | Two-stage: YOLOv11 detection + severity classifier |

### Pretrained Weights (Hugging Face)

| Model | Notes |
|---|---|
| [nsr51324/Road_Damage_Object_Detection](https://huggingface.co/nsr51324/Road_Damage_Object_Detection) | YOLOv8n/v10/v11 on 7-class road-damage set |
| [Samdutse/pothole-yolov8](https://huggingface.co/Samdutse/pothole-yolov8) | YOLOv8s on Smartathon pothole set (mAP50 0.816) |

### Routing & Safe-Route Apps

| Repo | Description |
|---|---|
| [Project-OSRM/osrm-backend](https://github.com/Project-OSRM/osrm-backend) | OSRM routing engine (BSD-licensed) |
| [narfect/SafePath2](https://github.com/narfect/SafePath2) | FastAPI + SQLModel + React/Leaflet safe-route app |
| [cadhann/hackbelfast](https://github.com/cadhann/hackbelfast) | SafeStep Belfast: explainable route details, crash-risk layer |

---

## 2. Datasets

| Dataset | Reference | Key Facts |
|---|---|---|
| **RDD2022** | Arya et al., *Geoscience Data Journal* 11(4), 846–862, 2024 | 47,420 images, 6 countries, 4 classes (D00, D10, D20, D40), CC BY-SA 4.0 |
| **RDD2020** | Arya et al., *Data in Brief* 36:107133, 2021 | 26,336 images (India, Japan, Czech Republic) |
| **RDD2018** | Maeda et al., arXiv:1801.09454 | 9,053 smartphone images, 8 damage classes (Japan) |

---

## 3. Core Papers

### Road Damage Detection

1. **Maeda et al. (2018)**. *Road Damage Detection and Classification Using Deep Neural Networks with Smartphone Images.* Computer-Aided Civil and Infrastructure Engineering 33(12), 1127–1141. [doi:10.1111/mice.12387](https://doi.org/10.1111/mice.12387)

2. **Arya et al. (2021)**. *Deep learning-based road damage detection and classification for multiple countries.* Automation in Construction 132:103935. [doi:10.1016/j.autcon.2021.103935](https://doi.org/10.1016/j.autcon.2021.103935)

3. **Arya et al. (2024)**. *RDD2022: A multi-national image dataset for automatic road damage detection.* Geoscience Data Journal 11(4), 846–862. [doi:10.1002/gdj3.260](https://doi.org/10.1002/gdj3.260)

4. **Arya et al. (2025)**. *Insights from the Road Damage Detection Challenge Series (2018–2024).* Nature Machine Intelligence. [doi:10.1038/s42256-025-01132-5](https://doi.org/10.1038/s42256-025-01132-5)

5. **Pham et al. (2024)**. *Optimizing YOLO Architectures for Optimal Road Damage Detection and Classification: A Comparative Study from YOLOv7 to YOLOv10.* arXiv:2410.08409

### Crowdsourced Road Hazard Reporting

6. **Eriksson et al. (2008)**. *The Pothole Patrol: Using a Mobile Sensor Network for Road Surface Monitoring.* ACM MobiSys 2008, 29–39. [doi:10.1145/1378600.1378605](https://doi.org/10.1145/1378600.1378605)

7. **Santani et al. (2015)**. *CommuniSense: Crowdsourcing Road Hazards in Nairobi.* MobileHCI 2015. arXiv:1506.07327

8. **FHWA/KC Scout (2022)**. *Crowdsourced pothole reports 98 percent accurate in the Kansas City metro area.* [fhwa.dot.gov](https://www.fhwa.dot.gov/innovation/everydaycounts/edcnews/20221110.cfm)

### Safe Route Planning & Risk Scoring

9. **Krumm & Horvitz (2017)**. *Risk-Aware Planning: Methods and Case Study on Safe Driving Routes.* AAAI 2017, 31(2), 4708–4714. [doi:10.1609/aaai.v31i2.19099](https://doi.org/10.1609/aaai.v31i2.19099)

10. **Luxen & Vetter (2011)**. *Real-time routing with OpenStreetMap data.* ACM SIGSPATIAL GIS '11, 513–516. [doi:10.1145/2093973.2094062](https://doi.org/10.1145/2093973.2094062)

### Federated Learning

11. **Saha et al. (2024)**. *Federated learning–based global road damage detection.* Computer-Aided Civil and Infrastructure Engineering. [doi:10.1111/mice.13186](https://doi.org/10.1111/mice.13186)

---

## 4. Component Mapping

| RoadGuardian Component | Key References |
|---|---|
| YOLOv8 Detection (RDD2022 classes) | RDD2022 paper, Ultralytics, oracl4 repo |
| Accuracy & Generalization | Arya et al. (2021) cross-country transfer, ORDDC metrics |
| Severity Estimation | Jyothismaria two-stage pipeline |
| Community Verification | CommuniSense, Pothole Patrol, FHWA/KC Scout |
| Risk Scoring Formula | Krumm & Horvitz, SafePath2 repo |
| OSRM Routing | Luxen & Vetter, osrm-backend |
| Future: Federated Learning | Saha et al. (2024) |

---

## 5. Research Questions from Limitations

The README's "Known limitations" section suggests these research directions:

1. **Model Accuracy**: Evaluate deployed weights on RDD2022 test split and local road images. Report F1, per-class results, and inference latency.

2. **Risk Calibration**: Compare formula with probabilistic approaches (Krumm & Horvitz). Calibrate against public crash records. Run sensitivity analysis on weights.

3. **Trust Models**: Study crowdsourcing verification models (CommuniSense). Test resistance to spam/collusion.

4. **Reporting Bias**: Address bias acknowledged in crowdsourcing literature. Consider passive sensing (Pothole Patrol) or periodic image sweeps.

5. **Federated Learning**: Implement FL for multi-city deployment without sharing images (Saha et al.).

6. **Severity Classification**: Add dedicated severity classifier and compare with user overrides (data already logged).

---

## 6. Citation Format

For publications, cite the dataset and key papers:

```
@article{arya2024rdd2022,
  title={RDD2022: A multi-national image dataset for automatic road damage detection},
  author={Arya, D. and Maeda, H. and Sekimoto, Y.},
  journal={Geoscience Data Journal},
  volume={11},
  number={4},
  pages={846--862},
  year={2024},
  doi={10.1002/gdj3.260}
}

@software{ultralytics2023yolov8,
  title={Ultralytics YOLOv8},
  author={Jocher, G. and Chaurasia, A. and Qiu, J.},
  year={2023},
  url={https://github.com/ultralytics/ultralytics}
}

@inproceedings{luxen2011osrm,
  title={Real-time routing with OpenStreetMap data},
  author={Luxen, D. and Vetter, C.},
  booktitle={ACM SIGSPATIAL GIS},
  pages={513--516},
  year={2011},
  doi={10.1145/2093973.2094062}
}
```

---

*Note: Metadata marked with ⚠ in the original compilation should be confirmed against publisher pages before formal citation.*
